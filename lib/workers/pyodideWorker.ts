import { loadPyodide, type PyodideAPI } from "pyodide";

/**
 * Kullanıcının Python kodunu Pyodide (WebAssembly CPython) ile Web Worker
 * içinde çalıştırır — ana thread'i kilitlemez, "Durdur" düğmesi worker'ı
 * sonlandırarak (terminate) çalışır (bkz. docs/08-guvenlik-sertlestirme.md
 * "Çalışma süresi sınırı"). Pyodide public/pyodide/ altından kendi alan
 * adımızdan servis edilir (bkz. scripts/copy-pyodide-assets.mjs) — dış CDN
 * kullanılmaz (docs/08 "Dış kaynak yok").
 *
 * `jsglobals` kısıtlanmış bir nesne: Python tarafındaki `import js` ile
 * gerçek `self`/`fetch`/`XMLHttpRequest`'e erişilemez — kullanıcı kodu
 * dışarıya ağ isteği atamaz (docs/08 "fetch/XHR devre dışı").
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
}

export interface PyodideWorkerResponse {
  requestId: string;
  stdout: string;
  error: string | null;
  jointTrace: number[][];
}

let pyodidePromise: Promise<PyodideAPI> | null = null;

function getPyodide(): Promise<PyodideAPI> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: "/pyodide/",
      jsglobals: { console: { log: () => {}, error: () => {}, warn: () => {} } },
    });
  }
  return pyodidePromise;
}

const ctx = self as unknown as {
  postMessage: (message: PyodideWorkerResponse) => void;
  onmessage: ((event: MessageEvent<PyodideWorkerRequest>) => void) | null;
};

ctx.onmessage = async (event) => {
  const { requestId, code, jointCount } = event.data;
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
      await pyodide.runPythonAsync(
        "class _Robot:\n" +
          "    def eklem_ac(self, index, derece):\n" +
          "        _eklem_ac(index, derece)\n" +
          "robot = _Robot()\n",
      );
    }

    await pyodide.runPythonAsync(code);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  ctx.postMessage({ requestId, stdout: outputLines.join("\n"), error: errorMessage, jointTrace });
};
