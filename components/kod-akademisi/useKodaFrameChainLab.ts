import { useEffect, useRef, useState } from "react";
import type { PyodideWorkerRequest, PyodideWorkerResponse, PyodideWorkerResult } from "@/lib/workers/pyodideWorker";
import { MAX_CODE_RUNTIME_MS } from "@/lib/workers/executionLimits";
import {
  buildFrameChainCode,
  evaluateFrameChainSenaryo,
  KODA_FRAME_CHAIN_SENARYOLARI,
  type FrameChainDegerlendirmesi,
} from "@/lib/kodaFrameChain";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

/**
 * "Çerçeve zincirini birleştir" orkestrasyonu — `useKodaTransferLab` ile
 * AYNI iskelet, robot/joint yok (bu görevde saf matris matematiği var,
 * `robot.*` çağrısı hiç kullanılmıyor — `jointCount`/`robotSpec` worker
 * isteğine hiç verilmiyor).
 */

const KOD_ANAHTARI = "robotik-platform:koda-frame-chain:kod";

export const KODA_FRAME_CHAIN_BASLANGIC_KODU = `TABAN_TO_WORLD = mat_carp(rotz(TABAN_ACI_RAD), translation(TABAN_X, TABAN_Y, 0.0))  # BUG BURADA — sırayı düzelt

sonuc = nokta_donustur(TABAN_TO_WORLD, (NOKTA_X, NOKTA_Y, NOKTA_Z))
print(f"{sonuc[0]:.6f},{sonuc[1]:.6f},{sonuc[2]:.6f}")
`;

function loadFromStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Depolama engellenmişse sessizce vazgeç.
  }
}

function runOnce(worker: Worker, request: PyodideWorkerRequest): Promise<PyodideWorkerResult> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      worker.removeEventListener("message", onMessage);
      reject(new Error(`Kod ${MAX_CODE_RUNTIME_MS / 1000} saniyelik çalışma sınırını aştı.`));
    }, MAX_CODE_RUNTIME_MS);

    function onMessage(event: MessageEvent<PyodideWorkerResponse>) {
      if (event.data.type !== "result" || event.data.requestId !== request.requestId) return;
      worker.removeEventListener("message", onMessage);
      clearTimeout(timeoutId);
      resolve(event.data);
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage(request);
  });
}

function waitForReady(worker: Worker): Promise<void> {
  return new Promise((resolve, reject) => {
    function onMessage(event: MessageEvent<PyodideWorkerResponse>) {
      if (event.data.type === "ready") {
        finish();
        resolve();
      } else if (event.data.type === "load-error") {
        finish();
        reject(new Error(event.data.error));
      }
    }
    function onError(errorEvent: ErrorEvent) {
      finish();
      reject(new Error(errorEvent.message || "Python worker başlatılamadı."));
    }
    function finish() {
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    }
    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
  });
}

export type KodaFrameChainDurum = "hazir" | "calisiyor" | "bitti";

export function useKodaFrameChainLab() {
  const record = useEvidenceRecorder();
  const [code, setCode] = useState(KODA_FRAME_CHAIN_BASLANGIC_KODU);
  const [durum, setDurum] = useState<KodaFrameChainDurum>("hazir");
  const [sonuclar, setSonuclar] = useState<FrameChainDegerlendirmesi[] | null>(null);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    function ilkYuklemeyiUygula() {
      const kayitliKod = loadFromStorage(KOD_ANAHTARI);
      if (kayitliKod) setCode(kayitliKod);
    }
    ilkYuklemeyiUygula();
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  function persistCode(value: string) {
    setCode(value);
    saveToStorage(KOD_ANAHTARI, value);
  }

  async function ensureWorker(): Promise<Worker> {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker("/workers/pyodide-worker.js", { type: "module" });
    workerRef.current = worker;
    await waitForReady(worker);
    return worker;
  }

  async function runAll() {
    if (durum === "calisiyor") return;
    setDurum("calisiyor");
    setHataMesaji(null);

    let worker: Worker;
    try {
      worker = await ensureWorker();
    } catch (error) {
      workerRef.current = null;
      setHataMesaji(`Python ortamı hazırlanamadı: ${error instanceof Error ? error.message : String(error)}`);
      setDurum("bitti");
      return;
    }

    const yeniSonuclar: FrameChainDegerlendirmesi[] = [];
    for (const senaryo of KODA_FRAME_CHAIN_SENARYOLARI) {
      const requestId = `${senaryo.id}-${Date.now()}-${Math.random()}`;
      const request: PyodideWorkerRequest = { type: "run", requestId, code: buildFrameChainCode(senaryo, code) };
      let result: PyodideWorkerResult;
      try {
        result = await runOnce(worker, request);
      } catch (error) {
        worker.terminate();
        workerRef.current = null;
        setHataMesaji(error instanceof Error ? error.message : String(error));
        setDurum("bitti");
        return;
      }
      yeniSonuclar.push(evaluateFrameChainSenaryo(senaryo, { error: result.error, stdout: result.stdout }));
    }

    setSonuclar(yeniSonuclar);
    const gorunur = yeniSonuclar.find((s) => s.senaryoId === "gorunur")?.gecti ?? false;
    const gizliTransfer = yeniSonuclar.find((s) => s.senaryoId === "gizli-transfer")?.gecti ?? false;
    record({
      skillId: "koda-frame-chain",
      stage: "assessed",
      result: gorunur && gizliTransfer ? "success" : "retry",
      metrics: { gorunur, gizliTransfer },
    });
    setDurum("bitti");
  }

  function reset() {
    persistCode(KODA_FRAME_CHAIN_BASLANGIC_KODU);
    setSonuclar(null);
    setHataMesaji(null);
  }

  return { code, setCode: persistCode, durum, sonuclar, hataMesaji, runAll, reset };
}
