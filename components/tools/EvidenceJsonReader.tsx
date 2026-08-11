"use client";

import { useCallback, useEffect, useId, useState, type DragEvent } from "react";
import { analyzeEvidenceExport, type EvidenceImportReport, type LessonFreshness } from "@/lib/evidenceImport";

type ManifestEntry = { teachingHash: string; predicateIds: string[]; durum: string };
type Manifest = Record<string, ManifestEntry>;
type ManifestStatus = "yukleniyor" | "hazir" | "hata";

const FRESHNESS_LABEL: Record<LessonFreshness, string> = {
  current: "güncel",
  stale: "eski sürüm",
  unknown: "bilinmiyor",
};

const FRESHNESS_STYLE: Record<LessonFreshness, string> = {
  current: "border-success-border bg-success-surface text-success-ink",
  stale: "border-warning-border bg-warning-surface text-warning-ink",
  unknown: "border-site-border bg-site-soft text-site-muted",
};

/**
 * Sprint 2 "Kanıt Dikey Dilimi", madde 4 — Evidence JSON Okuyucu.
 *
 * Kullanıcının kendi tarayıcısından dışa aktardığı bir kanıt dosyasını
 * sürükle-bırakla (veya dosya seçerek) açar. Dosya İÇERİĞİ hiçbir yere
 * gönderilmez — yalnız `analyzeEvidenceExport` ile bu sekmenin belleğinde
 * ayrıştırılır (bkz. lib/evidenceImport.ts). Ağa giden tek istek, dosyayla
 * ilgisi olmayan statik `/evidence-manifest.json` dosyasıdır (derleme
 * zamanında üretilir — bkz. scripts/build-evidence-manifest.ts) ve yalnız
 * "bu ders hâlâ aynı mı" karşılaştırması için kullanılır.
 */
export function EvidenceJsonReader() {
  const inputId = useId();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestStatus, setManifestStatus] = useState<ManifestStatus>("yukleniyor");
  const [report, setReport] = useState<EvidenceImportReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let iptal = false;
    fetch("/evidence-manifest.json")
      .then((yanit) => {
        if (!yanit.ok) throw new Error(String(yanit.status));
        return yanit.json() as Promise<Manifest>;
      })
      .then((veri) => {
        if (!iptal) {
          setManifest(veri);
          setManifestStatus("hazir");
        }
      })
      .catch(() => {
        if (!iptal) setManifestStatus("hata");
      });
    return () => {
      iptal = true;
    };
  }, []);

  const analyzeFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setReadError(null);
      setReport(null);
      let text: string;
      try {
        text = await file.text();
      } catch {
        setReadError("Dosya okunamadı.");
        return;
      }
      const currentTeachingHashes = manifest
        ? Object.fromEntries(Object.entries(manifest).map(([lessonId, entry]) => [lessonId, entry.teachingHash]))
        : {};
      setReport(analyzeEvidenceExport(text, currentTeachingHashes));
    },
    [manifest],
  );

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void analyzeFile(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-site-accent bg-site-soft" : "border-site-border bg-site-surface"}`}
      >
        <input
          id={inputId}
          type="file"
          accept=".json,application/json"
          className="peer sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void analyzeFile(file);
            event.target.value = "";
          }}
        />
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 cursor-pointer flex-col items-center gap-2 rounded-xl px-4 py-2 peer-focus-visible:ring-2 peer-focus-visible:ring-site-accent peer-focus-visible:ring-offset-2"
        >
          <span className="font-heading text-lg font-semibold text-site-ink">Kanıt dosyasını buraya sürükle</span>
          <span className="text-sm text-site-muted">veya tıklayıp bilgisayarından seç — yalnız bu tarayıcıda işlenir, hiçbir yere gönderilmez</span>
        </label>
      </div>

      {manifestStatus === "hata" && (
        <p role="status" className="text-sm text-site-muted">
          Güncel ders sürümleri şu an yüklenemedi; dosya yine de analiz edilebilir ama &ldquo;güncel / eski sürüm&rdquo; karşılaştırması &ldquo;bilinmiyor&rdquo; gösterilecek.
        </p>
      )}

      {readError && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-surface px-3 py-2 text-sm text-danger-ink">
          {readError}
        </p>
      )}

      {fileName && !report && !readError && (
        <p role="status" className="text-sm text-site-muted">
          {fileName} inceleniyor…
        </p>
      )}

      {report && <ReportView report={report} fileName={fileName} />}
    </div>
  );
}

function ReportView({ report, fileName }: { report: EvidenceImportReport; fileName: string | null }) {
  const errorCount = report.issues.filter((issue) => issue.severity === "error").length;
  const warningCount = report.issues.length - errorCount;

  return (
    <section aria-live="polite" className="flex flex-col gap-4">
      <div
        className={`rounded-xl border p-4 text-sm ${report.valid ? "border-success-border bg-success-surface text-success-ink" : "border-danger-border bg-danger-surface text-danger-ink"}`}
      >
        <p className="font-heading text-base font-bold">
          {report.valid ? "Geçerli kanıt dosyası" : "Geçersiz veya bozuk dosya"}
        </p>
        <p className="mt-1">
          {fileName ? `${fileName} · ` : ""}
          {report.validEventCount}/{report.eventCount} olay okunabildi
          {errorCount > 0 ? ` · ${errorCount} hata` : ""}
          {warningCount > 0 ? ` · ${warningCount} uyarı` : ""}
        </p>
      </div>

      {report.issues.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {report.issues.slice(0, 20).map((issue, index) => (
            <li
              key={index}
              className={`rounded-md border px-3 py-2 ${issue.severity === "error" ? "border-danger-border bg-danger-surface text-danger-ink" : "border-warning-border bg-warning-surface text-warning-ink"}`}
            >
              {issue.message}
            </li>
          ))}
          {report.issues.length > 20 && (
            <li className="text-xs text-site-muted">…ve {report.issues.length - 20} bulgu daha.</li>
          )}
        </ul>
      )}

      {report.lessons.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-site-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-site-soft text-site-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Ders</th>
                <th className="px-3 py-2 font-semibold">Olay</th>
                <th className="px-3 py-2 font-semibold">Sürüm</th>
                <th className="px-3 py-2 font-semibold">Kanıtlanmış beceri</th>
                <th className="px-3 py-2 font-semibold">Eski predicate</th>
              </tr>
            </thead>
            <tbody>
              {report.lessons.map((lesson) => (
                <tr key={lesson.lessonId} className="border-t border-site-border">
                  <td className="px-3 py-2 font-mono text-xs">{lesson.lessonId}</td>
                  <td className="px-3 py-2">{lesson.eventCount}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${FRESHNESS_STYLE[lesson.freshness]}`}>
                      {FRESHNESS_LABEL[lesson.freshness]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {lesson.passedPredicateIds.length > 0 ? lesson.passedPredicateIds.join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2 text-site-muted">
                    {lesson.stalePredicateIds.length > 0 ? lesson.stalePredicateIds.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report.lessons.some((lesson) => lesson.stalePredicateIds.length > 0) && (
        <p className="text-xs text-site-muted">
          &ldquo;Eski predicate&rdquo;: bu başarı kaydı, o zamanki predicate mantığıyla üretildi ama predicate o zamandan beri
          düzeltilip sürümlendi (bkz. içerik geçmişi). Sessizce geçerli sayılmaz; yeniden denemek gerekir.
        </p>
      )}
    </section>
  );
}
