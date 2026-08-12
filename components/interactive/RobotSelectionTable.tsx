"use client";

import { useMemo, useState } from "react";
import { useEvidenceRecorder } from "@/components/lesson/LessonEvidenceProvider";
import {
  createLabShareUrl,
  ExperimentShareButton,
  useSharedLabState,
} from "@/components/interactive/LabChallengeUi";
import {
  ROBOT_SOURCES,
  ROBOT_TASKS,
  evaluateTask,
  withLayoutChange,
  type CandidateEvaluation,
  type ConstraintStatus,
  type TaskSpec,
} from "@/lib/robotSelection";

const statusCopy: Record<ConstraintStatus | CandidateEvaluation["status"], string> = {
  pass: "Karşılıyor",
  fit: "Uygun aday",
  review: "Doğrulama gerekli",
  fail: "Kısıta takılıyor",
};

const statusClass: Record<ConstraintStatus | CandidateEvaluation["status"], string> = {
  pass: "border-emerald-600/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  fit: "border-emerald-600/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  review: "border-amber-600/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  fail: "border-red-600/35 bg-red-500/10 text-red-800 dark:text-red-200",
};

const familyCopy = [
  ["Mafsallı", "Geniş yönelim yeteneği; erişim, payload ve hücre güvenliği birlikte seçilir."],
  ["SCARA", "XY düzleminde hızlı pick-and-place; Z ekseni ve yönelim yapısı görevi sınırlar."],
  ["Delta", "Düşük hareketli kütleyle hızlı toplama; varyanta özel çalışma alanı doğrulanır."],
  ["Kartezyen", "Birbirine dik doğrusal eksenler; basit geometri fakat hacim ve strok maliyeti vardır."],
  ["Cobot", "İşbirlikçi özellikler sunar; uygulamayı kendiliğinden güvenli yapmaz."],
  ["AGV", "Tanımlı kılavuz/rota altyapısıyla öngörülebilir taşıma yapar."],
  ["AMR", "Harita ve algıyla daha dinamik rota kurar; saha risk analizi yine zorunludur."],
] as const;

/**
 * Görevin sayısal sınırları tek yerde. Önceden bu değerler yalnız her
 * adayın kartının içinde, "hedef ≥ 340 mm" gibi satırlara dağılmış
 * durumdaydı; kullanıcı neyi karşılamaya çalıştığını hiçbir yerde toplu
 * göremiyordu.
 */
function gorevSinirlari(task: TaskSpec) {
  const need = task.requirements;
  const list: { etiket: string; deger: string }[] = [];
  if (need.minPayloadKg) list.push({ etiket: "Payload", deger: `≥ ${need.minPayloadKg} kg` });
  if (need.minReachMm) list.push({ etiket: "Erişim", deger: `≥ ${need.minReachMm} mm` });
  if (need.maxRepeatabilityMm) list.push({ etiket: "Repeatability", deger: `≤ ${need.maxRepeatabilityMm} mm` });
  if (need.minDof) list.push({ etiket: "Eksen", deger: `≥ ${need.minDof}` });
  if (need.minSpeedMps) list.push({ etiket: "Hız", deger: `≥ ${need.minSpeedMps} m/s` });
  if (need.maxBodyWidthMm) list.push({ etiket: "Gövde genişliği", deger: `≤ ${need.maxBodyWidthMm} mm` });
  if (need.maxPositioningMm) list.push({ etiket: "Yanaşma", deger: `± ${need.maxPositioningMm} mm` });
  if (need.sharedWorkspace) list.push({ etiket: "Ortam", deger: "insanla paylaşılan alan" });
  if (need.layoutChangesOften) list.push({ etiket: "Yerleşim", deger: "sık değişiyor" });
  return list;
}

function SourceLink({ sourceId }: { sourceId: string }) {
  const source = ROBOT_SOURCES[sourceId];
  if (!source) return null;
  return <a className="underline decoration-dotted underline-offset-4" href={source.url} target="_blank" rel="noreferrer" title={`${source.documentNo} · ${source.revision} · ${source.location}`}>{source.publisher}: {source.documentNo}</a>;
}

function AdimBasligi({ numara, baslik, tamam, aktif }: { numara: number; baslik: string; tamam: boolean; aktif: boolean }) {
  return (
    <h4 className="flex items-center gap-2 font-semibold text-universite-ink">
      <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${tamam ? "bg-emerald-600 text-white" : aktif ? "bg-universite-accent text-white" : "bg-universite-ink/10 text-universite-ink/60"}`}>
        {tamam ? "✓" : numara}
      </span>
      {baslik}
    </h4>
  );
}

/**
 * A task-first shortlist: hard constraints are explicit, unknowns never become guessed values.
 *
 * Yeniden düzenleme gerekçesi: bileşen doğru çalışıyordu ama ne istediğini
 * söylemiyordu. Üç ayrı kırılma noktası vardı: (1) egzersizin amacı hiçbir
 * yerde yazmıyordu, (2) görevin sayısal sınırları tek yerde toplu
 * görünmüyordu, (3) "Bu adayı incele"ye basınca açılan savunma paneli, uzun
 * aday kartlarının altında ekran dışında kalıyordu — tıklamanın görünür bir
 * sonucu yoktu. Kartlar kısaltıldı, sayılar `details` içine alındı ve seçim
 * kartın kendi içinde de onaylanıyor.
 */
export function RobotSelectionTable() {
  const record = useEvidenceRecorder();
  const [taskId, setTaskId] = useState<TaskSpec["id"]>("electronics");
  const [layoutChangesOften, setLayoutChangesOften] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evidenceKeys, setEvidenceKeys] = useState<string[]>([]);
  const [rationale, setRationale] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useSharedLabState("robot-selection", (shared) => {
    setTaskId(shared.taskId);
    setLayoutChangesOften(shared.layoutChangesOften);
    setSelectedId(shared.selectedId);
    setEvidenceKeys(shared.evidenceKeys);
    setRationale(shared.rationale);
    setSubmitted(shared.submitted);
    setAttempts(shared.attempts);
  });

  const baseTask = ROBOT_TASKS.find((task) => task.id === taskId) ?? ROBOT_TASKS[0];
  const task = taskId === "intralogistics" ? withLayoutChange(baseTask, layoutChangesOften) : baseTask;
  const evaluations = useMemo(() => evaluateTask(task), [task]);
  const selected = evaluations.find((evaluation) => evaluation.candidate.id === selectedId) ?? null;
  const eligibleEvidence = selected?.constraints.filter((constraint) => constraint.quantitative && constraint.status !== "fail") ?? [];
  const rationaleReady = rationale.trim().length >= 40;
  const decisionReady = Boolean(selected && selected.status !== "fail" && evidenceKeys.length >= 4 && rationaleReady);
  const sinirlar = gorevSinirlari(task);

  function selectTask(next: TaskSpec["id"]) {
    setTaskId(next);
    setSelectedId(null);
    setEvidenceKeys([]);
    setRationale("");
    setSubmitted(false);
  }

  function selectCandidate(evaluation: CandidateEvaluation) {
    setSelectedId(evaluation.candidate.id);
    setEvidenceKeys([]);
    setRationale("");
    setSubmitted(false);
    record({
      skillId: "robot-selection",
      stage: "observed",
      result: evaluation.status === "fail" ? "retry" : "neutral",
      metrics: {
        taskId,
        candidateId: evaluation.candidate.id,
        decisionStatus: evaluation.status,
        failedConstraints: evaluation.constraints.filter((constraint) => constraint.status === "fail").length,
      },
    });
  }

  function submitDecision() {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setSubmitted(true);
    record({
      skillId: "robot-selection",
      stage: "assessed",
      result: decisionReady ? "success" : "retry",
      attempts: nextAttempts,
      metrics: {
        taskId,
        candidateId: selected?.candidate.id ?? "none",
        decisionStatus: selected?.status ?? "none",
        failedConstraints: selected?.constraints.filter((constraint) => constraint.status === "fail").length ?? 0,
        numericCriteria: evidenceKeys.length,
        eligibleNumericCriteria: eligibleEvidence.length,
        distinctCriteria: new Set(evidenceKeys).size === evidenceKeys.length,
        rationaleLength: rationale.trim().length,
      },
    });
  }

  return (
    <section className="my-6 rounded-2xl border border-universite-ink/15 bg-universite-surface p-4 sm:p-5" aria-labelledby="robot-selection-title">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-universite-accent">Şartname → kısıt → aday → savunma</p>
      <h3 id="robot-selection-title" className="mt-1 text-xl font-bold text-universite-ink">Robot Seçim Masası</h3>

      {/* Egzersizin ne istediği artık en başta yazıyor. */}
      <div className="mt-3 rounded-xl border border-universite-accent/30 bg-universite-bg p-3">
        <p className="text-sm text-universite-ink">
          <strong>Amacın:</strong> verilen görev için savunulabilir bir robot seçmek. Marka oylaması değil: adayı
          görevin sayısal sınırlarıyla eleyecek, seçtiğini en az dört ölçümle gerekçelendireceksin. Eksik üretici
          verisi tahminle doldurulmaz, “belirtilmemiş” kalır.
        </p>
        <ol className="mt-2 grid gap-1 text-sm text-universite-ink/75 sm:grid-cols-3">
          <li><strong>1.</strong> Görev brifini seç</li>
          <li><strong>2.</strong> Kısıtları karşılayan adayı seç</li>
          <li><strong>3.</strong> Kararını sayılarla savun</li>
        </ol>
      </div>

      <details className="mt-3 rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
        <summary className="min-h-11 cursor-pointer py-2 font-semibold">Yedi robot ailesi için karar sözlüğü</summary>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{familyCopy.map(([name, description]) => <div key={name}><dt className="font-semibold text-universite-ink">{name}</dt><dd className="text-sm text-universite-ink/70">{description}</dd></div>)}</dl>
      </details>

      <fieldset className="mt-5">
        <legend className="sr-only">Görev brifini seç</legend>
        <AdimBasligi numara={1} baslik="Görev brifini seç" tamam aktif={false} />
        <div className="mt-2 grid gap-2 md:grid-cols-3">{ROBOT_TASKS.map((candidateTask) => <button key={candidateTask.id} type="button" aria-pressed={taskId === candidateTask.id} onClick={() => selectTask(candidateTask.id)} className={`min-h-11 rounded-xl border p-3 text-left text-sm ${taskId === candidateTask.id ? "border-universite-accent bg-universite-bg" : "border-universite-ink/15"}`}><span className="block font-semibold">{candidateTask.title}</span><span className="mt-1 block text-universite-ink/65">{candidateTask.brief}</span></button>)}</div>
      </fieldset>

      {taskId === "intralogistics" && <label className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-universite-ink/10 bg-universite-bg px-3 text-sm"><input type="checkbox" checked={layoutChangesOften} onChange={(event) => { setLayoutChangesOften(event.target.checked); setSelectedId(null); setEvidenceKeys([]); setSubmitted(false); }} className="size-5 accent-universite-accent" /><span><strong>Yerleşim sık değişiyor.</strong> Bu tek gereksinimin sıralamayı nasıl değiştirdiğini gör.</span></label>}

      {/* Adayların karşılaması gereken sayılar, kartların içine dağılmadan önce. */}
      <div className="mt-4 rounded-xl border border-universite-ink/10 bg-universite-bg p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-universite-ink/65">Bu görevin karşılanması zorunlu sınırları</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {sinirlar.map((sinir) => (
            <li key={sinir.etiket} className="rounded-lg border border-universite-ink/15 px-2.5 py-1 text-xs">
              <span className="text-universite-ink/65">{sinir.etiket}</span> <span className="font-mono font-semibold text-universite-ink">{sinir.deger}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <AdimBasligi numara={2} baslik="Kısıtları karşılayan adayı seç" tamam={Boolean(selected)} aktif={!selected} />
        <div className="mt-2 grid gap-3 lg:grid-cols-3" aria-label="Robot adayları">{evaluations.map((evaluation) => {
          const isSelected = selectedId === evaluation.candidate.id;
          const takilan = evaluation.constraints.filter((constraint) => constraint.status === "fail");
          const bekleyen = evaluation.constraints.filter((constraint) => constraint.status === "review");
          const ozet = takilan.length > 0
            ? `${takilan.length} kısıt takılıyor: ${takilan.map((constraint) => constraint.label).join(", ")}`
            : bekleyen.length > 0
              ? `${evaluation.constraints.length - bekleyen.length}/${evaluation.constraints.length} kısıt net; ${bekleyen.length} tanesi doğrulama bekliyor: ${bekleyen.map((constraint) => constraint.label).join(", ")}`
              : `${evaluation.constraints.length} kısıtın tamamı karşılanıyor`;
          return <article key={evaluation.candidate.id} data-candidate-id={evaluation.candidate.id} data-decision-status={evaluation.status} className={`flex flex-col rounded-xl border p-3 ${isSelected ? "border-universite-accent ring-2 ring-universite-accent/20" : "border-universite-ink/15"}`}>
            <div className="flex items-start justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-universite-ink/60">{evaluation.candidate.family}</p><h5 className="font-bold text-universite-ink">{evaluation.candidate.model}</h5></div><span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[evaluation.status]}`}>{statusCopy[evaluation.status]}</span></div>

            {/* Kart artık beş satırlık tabloyla değil, tek cümlelik bir
                gerekçeyle açılıyor; sayılar isteyene bir tık uzakta. */}
            <p className="mt-2 text-xs leading-5 text-universite-ink/75">{ozet}</p>

            <details className="mt-2">
              <summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold text-universite-accent">Sayıları ve kaynakları göster</summary>
              <ul className="mt-1 space-y-2">{evaluation.constraints.map((constraint) => <li key={constraint.key} className="rounded-lg bg-universite-bg p-2 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-semibold">{constraint.label}</span><span className={constraint.status === "fail" ? "text-red-700 dark:text-red-300" : constraint.status === "review" ? "text-amber-800 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-300"}>{statusCopy[constraint.status]}</span></div><p className="mt-1 font-mono">{constraint.measured} · hedef {constraint.required}</p>{constraint.sourceId && <p className="mt-1 text-universite-ink/60"><SourceLink sourceId={constraint.sourceId} /></p>}</li>)}</ul>
            </details>

            <button type="button" onClick={() => selectCandidate(evaluation)} aria-pressed={isSelected} className="mt-3 min-h-11 w-full rounded-lg bg-universite-ink px-3 font-semibold text-universite-surface">{isSelected ? "Seçildi" : "Bu adayı incele"}</button>
            {isSelected && <p className="mt-2 text-center text-xs font-semibold text-universite-accent">↓ 3. adım aşağıda açıldı</p>}
          </article>;
        })}</div>
      </div>

      {selected && <div className="mt-5 rounded-xl border border-universite-accent/40 bg-universite-bg p-4">
        <AdimBasligi numara={3} baslik={`${selected.candidate.model} kararını sayılarla savun`} tamam={submitted && decisionReady} aktif={!submitted || !decisionReady} />
        {selected.status === "fail" && <div className="mt-3 rounded-lg border border-red-600/35 bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-100"><strong>Yanlış seçimin ölçülebilir sonucu:</strong><ul className="mt-1 list-disc pl-5">{selected.constraints.filter((constraint) => constraint.status === "fail").map((constraint) => <li key={constraint.key}>{constraint.label}: {constraint.explanation}</li>)}</ul></div>}
        {selected.status === "review" && <p className="mt-3 rounded-lg border border-amber-600/35 bg-amber-500/10 p-3 text-sm text-amber-950 dark:text-amber-100">Bu aday kısa listeye girebilir; sarı satırlar test koşulu, risk değerlendirmesi veya saha verisi bekliyor. “Uygun” ile “yayına/devreye almaya hazır” aynı şey değildir.</p>}
        <fieldset className="mt-4"><legend className="text-sm font-semibold">Savunmana katacağın en az dört sayısal kriter <span className="font-normal text-universite-ink/60">({evidenceKeys.length}/4 seçildi)</span></legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{eligibleEvidence.map((constraint) => <label key={constraint.key} className="flex min-h-11 items-start gap-2 rounded-lg border border-universite-ink/10 p-2 text-sm"><input type="checkbox" checked={evidenceKeys.includes(constraint.key)} onChange={(event) => setEvidenceKeys((current) => event.target.checked ? [...current, constraint.key] : current.filter((key) => key !== constraint.key))} className="mt-1 size-4 accent-universite-accent" /><span><strong>{constraint.label}:</strong> {constraint.measured} / {constraint.required}</span></label>)}</div></fieldset>
        <label className="mt-4 block text-sm font-semibold">Karar notu <span className="font-normal text-universite-ink/60">(en az 40 karakter; ödünleşimi ve bekleyen doğrulamayı yaz — {rationale.trim().length}/40)</span><textarea value={rationale} onChange={(event) => { setRationale(event.target.value); setSubmitted(false); }} rows={3} className="mt-2 w-full rounded-lg border border-universite-ink/20 bg-universite-surface p-3 font-normal" placeholder="Bu modeli seçiyorum çünkü…; ancak devreye almadan önce…" /></label>
        <button type="button" onClick={submitDecision} className="mt-3 min-h-11 rounded-lg bg-universite-accent px-4 font-bold text-white">Kararı test et</button>
        {submitted && <p className={`mt-3 rounded-lg border p-3 text-sm ${decisionReady ? statusClass.pass : statusClass.fail}`} aria-live="polite">{decisionReady ? "Kararın kanıtlandı: aday hard constraint’lere takılmıyor ve dört sayısal ölçümle savunuldu. Sarı doğrulamalar kapanmadan gerçek satın alma/devreye alma kararı verilmez." : selected.status === "fail" ? "Bu aday en az bir hard constraint’e takılıyor. Ölçülebilir açığı görüp başka aday seç." : `Kanıt eksik: ${Math.max(0, 4 - evidenceKeys.length)} sayısal kriter daha seç ve karar notunu en az 40 karaktere tamamla.`}</p>}
      </div>}

      <div className="mt-5 rounded-xl border border-universite-ink/10 p-3 text-xs text-universite-ink/65"><strong>Kaynak ve review durumu:</strong> Sayılar üretici dokümanlarına bağlandı; farklı test koşulları eşdeğer kabul edilmedi. Bu laboratuvarın teknik, pedagojik ve safety insan incelemesi henüz tamamlanmadı. Satın alma veya gerçek robot devreye alma önerisi değildir. Kaynak erişim tarihi: 2026-08-09.</div>
      <ExperimentShareButton
        seviye="universite"
        createShareUrl={() => createLabShareUrl({
          kind: "robot-selection",
          version: 1,
          taskId,
          layoutChangesOften,
          selectedId,
          evidenceKeys,
          rationale,
          submitted,
          attempts,
        })}
      />
    </section>
  );
}
