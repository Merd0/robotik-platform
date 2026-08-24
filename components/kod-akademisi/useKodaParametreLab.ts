import { useEffect, useRef, useState } from "react";
import { getRobotById } from "@/lib/robotics/robots";
import type { PyodideWorkerRequest, PyodideWorkerResponse, PyodideWorkerResult } from "@/lib/workers/pyodideWorker";
import { MAX_CODE_RUNTIME_MS } from "@/lib/workers/executionLimits";
import {
  buildParametreCode,
  evaluateKodaParametreSenaryo,
  KODA_PARAMETRE_SENARYOLARI,
  type KodaParametreDegerlendirmesi,
} from "@/lib/kodaParametreTransfer";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

/** "Aynı komutu farklı hedefe genelle" orkestrasyonu — kodaTransferGate/kodaFrameChain ile aynı iskelet. */

const ROBOT_ID = "generic-2dof";
const KOD_ANAHTARI = "robotik-platform:koda-parametre-transfer:kod";

export const KODA_PARAMETRE_BASLANGIC_KODU = `def git(j1, j2):
    robot.movej([90, -60])  # BUG BURADA — j1, j2 parametrelerini kullanmıyor

git(HEDEF_J1, HEDEF_J2)
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

export type KodaParametreDurum = "hazir" | "calisiyor" | "bitti";

export function useKodaParametreLab() {
  const robot = getRobotById(ROBOT_ID);
  const record = useEvidenceRecorder();
  const [code, setCode] = useState(KODA_PARAMETRE_BASLANGIC_KODU);
  const [durum, setDurum] = useState<KodaParametreDurum>("hazir");
  const [sonuclar, setSonuclar] = useState<KodaParametreDegerlendirmesi[] | null>(null);
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

    const yeniSonuclar: KodaParametreDegerlendirmesi[] = [];
    for (const senaryo of KODA_PARAMETRE_SENARYOLARI) {
      const requestId = `${senaryo.id}-${Date.now()}-${Math.random()}`;
      const request: PyodideWorkerRequest = {
        type: "run",
        requestId,
        code: buildParametreCode(senaryo, code),
        jointCount: robot.joints.length,
        robotSpec: robot,
      };
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
      yeniSonuclar.push(evaluateKodaParametreSenaryo(senaryo, { error: result.error, jointTrace: result.jointTrace }));
    }

    setSonuclar(yeniSonuclar);
    const gorunur = yeniSonuclar.find((s) => s.senaryoId === "gorunur")?.gecti ?? false;
    const gizliTransfer = yeniSonuclar.find((s) => s.senaryoId === "gizli-transfer")?.gecti ?? false;
    record({
      skillId: "koda-parametre-transfer",
      stage: "assessed",
      result: gorunur && gizliTransfer ? "success" : "retry",
      metrics: { gorunur, gizliTransfer },
    });
    setDurum("bitti");
  }

  function reset() {
    persistCode(KODA_PARAMETRE_BASLANGIC_KODU);
    setSonuclar(null);
    setHataMesaji(null);
  }

  return { code, setCode: persistCode, durum, sonuclar, hataMesaji, runAll, reset };
}
