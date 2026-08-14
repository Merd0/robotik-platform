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
      if (jointCount) {
        namespace.set("_eklem_ac", (index: number, derece: number) => {
          if (!Number.isInteger(index) || index < 0 || index >= currentAngles.length) {
            throw new RangeError(`Eklem indeksi 0-${currentAngles.length - 1} aralığında olmalı.`);
          }
          if (!Number.isFinite(derece)) throw new TypeError("Eklem açısı sonlu bir sayı olmalı.");
          currentAngles[index] = (derece * Math.PI) / 180;
          jointTrace.push([...currentAngles]);
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
          namespace.set("_movej", (anglesArg: unknown) => {
            const validated = validateJointAnglesDeg(robotSpec, toPlainArray(anglesArg));
            if (!validated.ok) throw new Error(validated.message);
            validated.value.forEach((angle, index) => (currentAngles[index] = angle));
            jointTrace.push([...currentAngles]);
          });

          namespace.set("_movel", (x: number, y: number, z: number) => {
            const solved = solveCartesianTarget(robotSpec, { x, y, z }, currentAngles);
            if (!solved.ok) throw new Error(solved.message);
            solved.value.forEach((angle, index) => (currentAngles[index] = angle));
            jointTrace.push([...currentAngles]);
          });

          namespace.set("_get_joints", () => pyodide.toPy(radiansToDegrees(currentAngles)));

          namespace.set("_get_tcp", () => {
            const pose = poseOf(robotSpec, currentAngles);
            return pyodide.toPy([pose.x, pose.y, pose.z]);
          });

          namespace.set("_forward_kinematics", (anglesArg: unknown) => {
            const validated = validateJointAnglesDeg(robotSpec, toPlainArray(anglesArg));
            if (!validated.ok) throw new Error(validated.message);
            const pose = poseOf(robotSpec, validated.value);
            return pyodide.toPy([pose.x, pose.y, pose.z]);
          });

          namespace.set("_inverse_kinematics", (x: number, y: number, z: number) => {
            const solved = solveCartesianTarget(robotSpec, { x, y, z }, currentAngles);
            if (!solved.ok) throw new Error(solved.message);
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
            "        _eklem_ac(index, derece)\n" +
            (canUseIk
              ? "    def hedefe_git(self, x, y):\n" +
                "        return _hedefe_git(x, y)\n"
              : "") +
            (hasRobotSpec
              ? "    def movej(self, acilar):\n" +
                "        _movej(acilar)\n" +
                "    def movel(self, x, y, z, speed=None):\n" +
                "        _movel(x, y, z)\n" +
                "    def get_joints(self):\n" +
                "        return _get_joints()\n" +
                "    def get_tcp(self):\n" +
                "        x, y, z = _get_tcp()\n" +
                "        return _Pose(x, y, z)\n" +
                "    def forward_kinematics(self, acilar):\n" +
                "        x, y, z = _forward_kinematics(acilar)\n" +
                "        return _Pose(x, y, z)\n" +
                "    def inverse_kinematics(self, x, y, z):\n" +
                "        return _inverse_kinematics(x, y, z)\n"
              : "") +
            "robot = _Robot()\n",
          { globals: namespace },
        );
      }

      await pyodide.runPythonAsync(code, { globals: namespace, filename: "<robotik-lab>" });
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
