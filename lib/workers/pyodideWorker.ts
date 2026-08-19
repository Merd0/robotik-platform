import { loadPyodide, type PyodideAPI } from "pyodide";
import { inverseKinematicsAnalytical2Dof, type RobotSpec } from "@/lib/robotics/kinematics";
import {
  poseOf,
  radiansToDegrees,
  solveCartesianTarget,
  validateJointAnglesDeg,
} from "@/lib/robotics/pythonBridge";
import { BoundedTextCollector, BoundedTraceCollector } from "@/lib/workers/executionLimits";

/**
 * Kullanıcının Python kodunu Pyodide (WebAssembly CPython) ile Web Worker
 * içinde çalıştırır — ana thread'i kilitlemez, "Durdur" düğmesi worker'ı
 * sonlandırarak (terminate) çalışır (bkz. docs/08-guvenlik-sertlestirme.md
 * "Çalışma süresi sınırı"). Pyodide public/pyodide/ altından kendi alan
 * adımızdan servis edilir (bkz. scripts/copy-pyodide-assets.mjs) — dış CDN
 * kullanılmaz (docs/08 "Dış kaynak yok").
 *
 * Bu worker MODÜL worker olarak yüklenmeli (`new Worker(url, { type:
 * "module" })`, bkz. CodeRunner.tsx ve scripts/build-worker.mjs) —
 * pyodide.mjs, klasik (module olmayan) bir worker içinde çalıştığını
 * tespit ederse kendi içinde bilinçli olarak hata fırlatıyor.
 *
 * Ağ erişimi kısıtlaması `loadPyodide()` ÇAĞRISINDA değil, YÜKLEME
 * BİTTİKTEN SONRA uygulanır — `jsglobals` seçeneğine kısıtlı bir nesne
 * vermek Pyodide'in kendi başlatma sürecini bozuyordu (bkz.
 * docs/durum-denetim.md Faz 3 kontrol noktası).
 */

export interface PyodideWorkerRequest {
  type: "run";
  requestId: string;
  code: string;
  /**
   * Verilirse, Python tarafına `robot` adlı basit bir nesne enjekte edilir:
   * `robot.eklem_ac(index, derece)` her çağrıda o eklemin açısını ayarlar.
   * `jointTrace` olarak her çağrı sonrası tüm eklemlerin anlık durumu döner.
   */
  jointCount?: number;
  /**
   * Verilirse VE tam 2 eklemliyse, `robot.hedefe_git(x, y)` da enjekte
   * edilir: analitik 2-DOF ters kinematik (bkz. kinematics.ts) ile hedef
   * koordinata ulaşmayı dener, başarılıysa True/başarısızsa False döner.
   *
   * Verilirse (eklem sayısı fark etmeksizin), ayrıca `robot.movej(acilar)`,
   * `robot.movel(x, y, z, speed=None)`, `robot.get_joints()`,
   * `robot.get_tcp()`, `robot.forward_kinematics(acilar)` ve
   * `robot.inverse_kinematics(x, y, z)` da enjekte edilir — bkz.
   * lib/robotics/pythonBridge.ts. `eklem_ac`/`hedefe_git` ile aynı
   * `currentAngles`/`jointTrace` durumunu paylaşırlar; `speed` şu an
   * kaydedilmez, sadece kabul edilir (gerçek zamanlı hız/animasyon simüle
   * edilmez — bkz. content/d-programlama/lise/d-lise-koordinat-hiz-bekleme.mdx
   * ile aynı dürüst sınır).
   */
  robotSpec?: RobotSpec;
}

export interface PyodideWorkerReady {
  type: "ready";
}

export interface PyodideWorkerLoadError {
  type: "load-error";
  error: string;
}

export interface PyodideWorkerResult {
  type: "result";
  requestId: string;
  stdout: string;
  error: string | null;
  jointTrace: number[][];
  limits: {
    outputTruncated: boolean;
    traceTruncated: boolean;
    outputEmissions: number;
  };
}

export type PyodideWorkerResponse =
  | PyodideWorkerReady
  | PyodideWorkerLoadError
  | PyodideWorkerResult;

/**
 * Python'dan gelen bir liste argümanı, Pyodide FFI sınırını PyProxy olarak
 * geçer (bkz. pyodide.d.ts `PyProxy.toJs`) — ham bir JS dizisi değildir.
 * Dönüştürülemezse (öğrenci liste yerine tek bir sayı verdiyse ör.
 * `movej(5)`) boş dizi döner; bu durumda validateJointAnglesDeg zaten
 * "N eklem açısı bekliyor" öğretici hatasını üretir.
 */
function toPlainArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const proxy = value as { toJs?: () => unknown; destroy?: () => void } | null | undefined;
  if (typeof proxy?.toJs === "function") {
    const converted = proxy.toJs();
    proxy.destroy?.();
    if (Array.isArray(converted)) return converted;
  }
  return [];
}

let pyodidePromise: Promise<PyodideAPI> | null = null;

const ctx = self as unknown as {
  postMessage: (message: PyodideWorkerResponse) => void;
  onmessage: ((event: MessageEvent<PyodideWorkerRequest>) => void) | null;
};

function getPyodide(): Promise<PyodideAPI> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({ indexURL: "/pyodide/" }).then((pyodide) => {
      const workerGlobal = self as unknown as Record<string, unknown>;
      delete workerGlobal.fetch;
      delete workerGlobal.XMLHttpRequest;
      return pyodide;
    });
  }
  return pyodidePromise;
}

async function initializePyodide(): Promise<void> {
  try {
    await getPyodide();
    ctx.postMessage({ type: "ready" });
  } catch (error) {
    ctx.postMessage({
      type: "load-error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Ortam kullanıcı kodundan önce hazırlanır. Ana thread kod zaman aşımını
// yalnız `ready` mesajından sonra başlatır; indirme/başlatma bütçeye girmez.
void initializePyodide();

ctx.onmessage = async (event) => {
  if (event.data.type !== "run") return;
  const { requestId, code, jointCount, robotSpec } = event.data;
  const output = new BoundedTextCollector();
  const jointTrace = new BoundedTraceCollector<number[]>();
  let errorMessage: string | null = null;

  try {
    const pyodide = await getPyodide();
    pyodide.setStdout({ batched: (msg: string) => output.push(msg) });
    pyodide.setStderr({ batched: (msg: string) => output.push(msg) });
    const namespace = pyodide.runPython("dict()");

    const currentAngles = new Array(jointCount ?? 0).fill(0);
    try {
      // `RobotHatasi` her zaman tanımlı — robot olmayan/hazırlık aşamasındaki
      // sarmalayıcı da onu referans alabilsin diye. Bu sınıf, öğretici
      // (Türkçe, kısa) hata mesajlarını Python'ın CPython'un ürettiği çok
      // satırlı "Traceback (most recent call last): ..." dökümünden ayırmak
      // için var — bkz. aşağıdaki sarmalanmış exec bloğu.
      await pyodide.runPythonAsync("class RobotHatasi(Exception):\n    pass\n", { globals: namespace });

      if (jointCount) {
        // Doğrulama başarısız olduğunda ARTIK throw ETMİYORLAR — bir hata
        // mesajı (string) döndürüyorlar. Python tarafındaki `_Robot` sarmalayıcı
        // bunu görüp `raise RobotHatasi(mesaj)` ile TEMİZ bir Python istisnası
        // üretiyor. Doğrudan `throw new Error(...)` etmek de teknik olarak
        // Python'a JsException olarak geçerdi, ama geri döndüğünde CPython'un
        // ürettiği tam "Traceback (most recent call last): ..." dökümü
        // (dahili dosya/satır bilgisiyle) `error.message`'a yazılırdı — bu,
        // öğretici mesajın önüne ham, ürkütücü bir yığın ekler (bkz.
        // docs/durum-codex.md "Kod Akademisi" — bu senaryo ekran görüntüsüyle
        // yakalandı).
        namespace.set("_eklem_ac", (index: number, derece: number): string | undefined => {
          if (!Number.isInteger(index) || index < 0 || index >= currentAngles.length) {
            return `Eklem indeksi 0-${currentAngles.length - 1} aralığında olmalı.`;
          }
          if (!Number.isFinite(derece)) return "Eklem açısı sonlu bir sayı olmalı.";
          currentAngles[index] = (derece * Math.PI) / 180;
          jointTrace.push([...currentAngles]);
          return undefined;
        });

        const canUseIk = robotSpec && robotSpec.joints.length === 2;
        if (canUseIk) {
          namespace.set("_hedefe_git", (x: number, y: number) => {
            const angles = inverseKinematicsAnalytical2Dof(robotSpec, { x, y });
            if (!angles) return false;
            currentAngles[0] = angles[0];
            currentAngles[1] = angles[1];
            jointTrace.push([...currentAngles]);
            return true;
          });
        }

        const hasRobotSpec = Boolean(robotSpec);
        if (robotSpec) {
          namespace.set("_movej", (anglesArg: unknown): string | undefined => {
            const validated = validateJointAnglesDeg(robotSpec, toPlainArray(anglesArg));
            if (!validated.ok) return validated.message;
            validated.value.forEach((angle, index) => (currentAngles[index] = angle));
            jointTrace.push([...currentAngles]);
            return undefined;
          });

          namespace.set("_movel", (x: number, y: number, z: number): string | undefined => {
            const solved = solveCartesianTarget(robotSpec, { x, y, z }, currentAngles);
            if (!solved.ok) return solved.message;
            solved.value.forEach((angle, index) => (currentAngles[index] = angle));
            jointTrace.push([...currentAngles]);
            return undefined;
          });

          namespace.set("_get_joints", () => pyodide.toPy(radiansToDegrees(currentAngles)));

          namespace.set("_get_tcp", () => {
            const pose = poseOf(robotSpec, currentAngles);
            return pyodide.toPy([pose.x, pose.y, pose.z]);
          });

          // Başarı değeri her zaman bir liste (pyodide.toPy), hata değeri her
          // zaman düz bir string — Python tarafı `isinstance(_sonuc, str)` ile
          // ayırt ediyor, iki farklı JS→Python geçiş türü hiç karışmıyor.
          namespace.set("_forward_kinematics", (anglesArg: unknown) => {
            const validated = validateJointAnglesDeg(robotSpec, toPlainArray(anglesArg));
            if (!validated.ok) return validated.message;
            const pose = poseOf(robotSpec, validated.value);
            return pyodide.toPy([pose.x, pose.y, pose.z]);
          });

          namespace.set("_inverse_kinematics", (x: number, y: number, z: number) => {
            const solved = solveCartesianTarget(robotSpec, { x, y, z }, currentAngles);
            if (!solved.ok) return solved.message;
            return pyodide.toPy(radiansToDegrees(solved.value));
          });
        }

        await pyodide.runPythonAsync(
          "class _Pose:\n" +
            "    def __init__(self, x, y, z):\n" +
            "        self.x = x\n" +
            "        self.y = y\n" +
            "        self.z = z\n" +
            '    def __repr__(self):\n' +
            '        return f"Pose(x={self.x:.3f}, y={self.y:.3f}, z={self.z:.3f})"\n' +
            "class _Robot:\n" +
            "    def eklem_ac(self, index, derece):\n" +
            "        _hata = _eklem_ac(index, derece)\n" +
            "        if _hata is not None:\n" +
            "            raise RobotHatasi(_hata)\n" +
            (canUseIk
              ? "    def hedefe_git(self, x, y):\n" +
                "        return _hedefe_git(x, y)\n"
              : "") +
            (hasRobotSpec
              ? "    def movej(self, acilar):\n" +
                "        _hata = _movej(acilar)\n" +
                "        if _hata is not None:\n" +
                "            raise RobotHatasi(_hata)\n" +
                "    def movel(self, x, y, z, speed=None):\n" +
                "        _hata = _movel(x, y, z)\n" +
                "        if _hata is not None:\n" +
                "            raise RobotHatasi(_hata)\n" +
                "    def get_joints(self):\n" +
                "        return _get_joints()\n" +
                "    def get_tcp(self):\n" +
                "        x, y, z = _get_tcp()\n" +
                "        return _Pose(x, y, z)\n" +
                "    def forward_kinematics(self, acilar):\n" +
                "        _sonuc = _forward_kinematics(acilar)\n" +
                "        if isinstance(_sonuc, str):\n" +
                "            raise RobotHatasi(_sonuc)\n" +
                "        x, y, z = _sonuc\n" +
                "        return _Pose(x, y, z)\n" +
                "    def inverse_kinematics(self, x, y, z):\n" +
                "        _sonuc = _inverse_kinematics(x, y, z)\n" +
                "        if isinstance(_sonuc, str):\n" +
                "            raise RobotHatasi(_sonuc)\n" +
                "        return _sonuc\n"
              : "") +
            "robot = _Robot()\n",
          { globals: namespace },
        );
      }

      // Kullanıcı kodu DOĞRUDAN çalıştırılmıyor — Python içinde bir
      // try/except'e sarılıyor ki hiçbir istisna (RobotHatasi veya
      // kullanıcının kendi yazım hatası: NameError, SyntaxError, ...)
      // `runPythonAsync`'in dışına, CPython'un tam "Traceback (most recent
      // call last): ..." dökümüyle sızmasın. `RobotHatasi` için mesaj
      // OLDUĞU GİBİ (tip öneki yok — zaten Türkçe ve öğretici); gerçek Python
      // hataları için `traceback.format_exception_only` kullanılıyor — bu da
      // yalnız "HataTürü: mesaj" verir, dahili dosya/satır çerçevesi vermez.
      namespace.set("_kullanici_kodu", code);
      await pyodide.runPythonAsync(
        "import traceback as _traceback\n" +
          "_hata_mesaji = None\n" +
          "try:\n" +
          '    exec(compile(_kullanici_kodu, "<robotik-lab>", "exec"), globals())\n' +
          "except RobotHatasi as _e:\n" +
          "    _hata_mesaji = str(_e)\n" +
          "except BaseException as _e:\n" +
          "    _hata_mesaji = ''.join(_traceback.format_exception_only(type(_e), _e)).strip()\n",
        { globals: namespace },
      );
      const hataMesaji = namespace.get("_hata_mesaji");
      if (typeof hataMesaji === "string") errorMessage = hataMesaji;
    } finally {
      namespace.destroy();
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  ctx.postMessage({
    type: "result",
    requestId,
    stdout: output.toString(),
    error: errorMessage,
    jointTrace: jointTrace.values,
    limits: {
      outputTruncated: output.truncated,
      traceTruncated: jointTrace.truncated,
      outputEmissions: output.emissions,
    },
  });
};
