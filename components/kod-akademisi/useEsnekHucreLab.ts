import { useEffect, useRef, useState } from "react";
import { getRobotById } from "@/lib/robotics/robots";
import type { PyodideWorkerRequest, PyodideWorkerResponse, PyodideWorkerResult } from "@/lib/workers/pyodideWorker";
import { MAX_CODE_RUNTIME_MS } from "@/lib/workers/executionLimits";
import {
  buildEsnekHucreCode,
  ESNEK_HUCRE_SENARYOLARI,
  evaluateEsnekHucreSenaryo,
  type EsnekHucreSenaryoDegerlendirmesi,
} from "@/lib/esnekHucre";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";

/**
 * "Esnek Hücreyi Devreye Al" kapanış projesinin worker orkestrasyonu.
 * `useCodeRunnerEngine`'den KASITLI olarak ayrı: o hook TEK bir kod
 * çalıştırmasını tek bir robot pozuna bağlıyor; bu proje AYNI kodu beş
 * farklı senaryoyla (her biri kendi `IS_EMRI` önekiyle) ART ARDA çalıştırıp
 * davranışsal bir sonuç listesi üretiyor — paylaşılan tek şey worker'ın
 * mesaj protokolü (`PyodideWorkerRequest`/`Response`), motor mantığı değil.
 */

const ROBOT_ID = "generic-2dof";
const ESNEK_HUCRE_KOD_ANAHTARI = "robotik-platform:esnek-hucre:kod";
const ESNEK_HUCRE_ALTIN_ANAHTARI = "robotik-platform:esnek-hucre:altin";

export const ESNEK_HUCRE_BASLANGIC_KODU = `# IS_EMRI: {"parca_turu": "...", "hedefler": [{"x": .., "y": .., "z": ..}, ...]}
# Kullanabileceğin araçlar:
#   robot.movel(x, y, z)          -> hedefe git, ulaşılamazsa RobotHatasi fırlatır
#   hucre.sensor_onayi_bekle()    -> True/False döner
#   hucre.durum_gec("ready")      -> durum geçişini kaydet ve yazdır
#   hucre.hata_bildir("sebep")    -> arızayı kaydet ve yazdır
#
# Buraya kendi hücre yöneticini yaz.
`;

export interface EsnekHucreGoldenImza {
  durum: string[];
  hareket: number;
}

export interface EsnekHucreGolden {
  kod: string;
  imzalar: Record<string, EsnekHucreGoldenImza>;
}

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
    // Depolama engellenmişse (gizli sekme vb.) sessizce vazgeç — oturum
    // içi state zaten yeterli, kalıcılık kaybı burada kritik değil.
  }
}

function loadGolden(): EsnekHucreGolden | null {
  const raw = loadFromStorage(ESNEK_HUCRE_ALTIN_ANAHTARI);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EsnekHucreGolden;
    if (typeof parsed.kod === "string" && parsed.imzalar && typeof parsed.imzalar === "object") return parsed;
    return null;
  } catch {
    return null;
  }
}

function imzalarEsit(a: EsnekHucreGoldenImza | undefined, b: EsnekHucreGoldenImza): boolean {
  if (!a) return false;
  if (a.hareket !== b.hareket) return false;
  if (a.durum.length !== b.durum.length) return false;
  return a.durum.every((deger, index) => deger === b.durum[index]);
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

export type EsnekHucreDurum = "hazir" | "calisiyor" | "bitti";

export function useEsnekHucreLab() {
  const robot = getRobotById(ROBOT_ID);
  const record = useEvidenceRecorder();
  const [code, setCode] = useState(ESNEK_HUCRE_BASLANGIC_KODU);
  const [durum, setDurum] = useState<EsnekHucreDurum>("hazir");
  const [sonuclar, setSonuclar] = useState<EsnekHucreSenaryoDegerlendirmesi[] | null>(null);
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const [golden, setGolden] = useState<EsnekHucreGolden | null>(null);
  const [refactorSonucu, setRefactorSonucu] = useState<{ kodDegisti: boolean; gecerli: boolean } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    function ilkYuklemeyiUygula() {
      const kayitliKod = loadFromStorage(ESNEK_HUCRE_KOD_ANAHTARI);
      if (kayitliKod) setCode(kayitliKod);
      setGolden(loadGolden());
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
    saveToStorage(ESNEK_HUCRE_KOD_ANAHTARI, value);
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

    const yeniSonuclar: EsnekHucreSenaryoDegerlendirmesi[] = [];
    const yeniImzalar: Record<string, EsnekHucreGoldenImza> = {};

    for (const senaryo of ESNEK_HUCRE_SENARYOLARI) {
      const requestId = `${senaryo.id}-${Date.now()}-${Math.random()}`;
      const request: PyodideWorkerRequest = {
        type: "run",
        requestId,
        code: buildEsnekHucreCode(senaryo, code),
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
      const degerlendirme = evaluateEsnekHucreSenaryo(senaryo, {
        stdout: result.stdout,
        error: result.error,
        jointTrace: result.jointTrace,
      });
      yeniSonuclar.push(degerlendirme);
      yeniImzalar[senaryo.id] = { durum: degerlendirme.durumGecmisi, hareket: degerlendirme.hareketSayisi };
    }

    setSonuclar(yeniSonuclar);
    const hepsiGecti = yeniSonuclar.every((s) => s.gecti);
    const metrics: Record<string, boolean> = {};
    yeniSonuclar.forEach((s, index) => (metrics[`gorev${index + 1}`] = s.gecti));
    record({
      skillId: "esnek-hucre-capstone",
      stage: "assessed",
      result: hepsiGecti ? "success" : "retry",
      metrics,
    });

    if (hepsiGecti) {
      if (!golden) {
        const yeniGolden: EsnekHucreGolden = { kod: code, imzalar: yeniImzalar };
        setGolden(yeniGolden);
        saveToStorage(ESNEK_HUCRE_ALTIN_ANAHTARI, JSON.stringify(yeniGolden));
        setRefactorSonucu(null);
      } else {
        const kodDegisti = code !== golden.kod;
        const refactorGecerli = ESNEK_HUCRE_SENARYOLARI.every((senaryo) =>
          imzalarEsit(golden.imzalar[senaryo.id], yeniImzalar[senaryo.id]),
        );
        // `refactorSonucu` STATE'e yazılıyor — bileşen kendi ayrı bir
        // kodDegisti/refactorGecerli hesabı YAPMAZ. Aksi hâlde bileşenin
        // `code` state'i ile bu fonksiyonun kapadığı `code` closure'ı,
        // hızlı dolgu+tıklama arasında (özellikle e2e testte) birbirinden
        // ayrılıp UI'ın "geçti" dediği ile gerçekte DEĞERLENDİRİLEN kod
        // farklı şeyler olabilirdi (bkz. docs/durum-denetim.md — bu tam
        // olarak canlı bir e2e koşusunda yakalanan bir hata).
        setRefactorSonucu({ kodDegisti, gecerli: kodDegisti && refactorGecerli });
        record({
          skillId: "esnek-hucre-refactor",
          stage: "assessed",
          result: kodDegisti && refactorGecerli ? "success" : "retry",
          metrics: { kodDegisti, refactorGecerli },
        });
      }
    } else {
      setRefactorSonucu(null);
    }

    setDurum("bitti");
  }

  function reset() {
    persistCode(ESNEK_HUCRE_BASLANGIC_KODU);
    setSonuclar(null);
    setHataMesaji(null);
    setRefactorSonucu(null);
  }

  return {
    code,
    setCode: persistCode,
    durum,
    sonuclar,
    hataMesaji,
    golden,
    refactorSonucu,
    runAll,
    reset,
  };
}
