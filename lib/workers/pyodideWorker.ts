import { loadPyodide, type PyodideAPI } from "pyodide";
import { inverseKinematicsAnalytical2Dof, type RobotSpec } from "@/lib/robotics/kinematics";

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
   */
  robotSpec?: RobotSpec;
}

export interface PyodideWorkerResponse {
  requestId: string;
  stdout: string;
  error: string | null;
  jointTrace: number[][];
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

ctx.onmessage = async (event) => {
  const { requestId, code, jointCount, robotSpec } = event.data;
  const outputLines: string[] = [];
  const jointTrace: number[][] = [];
  let errorMessage: string | null = null;

  try {
    const pyodide = await getPyodide();
    pyodide.setStdout({ batched: (msg: string) => outputLines.push(msg) });
    pyodide.setStderr({ batched: (msg: string) => outputLines.push(msg) });

    const currentAngles = new Array(jointCount ?? 0).fill(0);
    if (jointCount) {
      pyodide.globals.set("_eklem_ac", (index: number, derece: number) => {
        currentAngles[index] = (derece * Math.PI) / 180;
        jointTrace.push([...currentAngles]);
      });

      const canUseIk = robotSpec && robotSpec.joints.length === 2;
      if (canUseIk) {
        pyodide.globals.set("_hedefe_git", (x: number, y: number) => {
          const angles = inverseKinematicsAnalytical2Dof(robotSpec, { x, y });
          if (!angles) return false;
          currentAngles[0] = angles[0];
          currentAngles[1] = angles[1];
          jointTrace.push([...currentAngles]);
          return true;
        });
      }

      await pyodide.runPythonAsync(
        "class _Robot:\n" +
          "    def eklem_ac(self, index, derece):\n" +
          "        _eklem_ac(index, derece)\n" +
          (canUseIk
            ? "    def hedefe_git(self, x, y):\n" +
              "        return _hedefe_git(x, y)\n"
            : "") +
          "robot = _Robot()\n",
      );
    }

    await pyodide.runPythonAsync(code);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  ctx.postMessage({ requestId, stdout: outputLines.join("\n"), error: errorMessage, jointTrace });
};
