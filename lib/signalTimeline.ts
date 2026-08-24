export interface HandshakeAnalysis {
  requestStep: number | null;
  acknowledgementStep: number | null;
  complete: boolean;
  correctOrder: boolean;
}

function firstActiveStep(row: readonly boolean[] | undefined): number | null {
  if (!row) return null;
  const index = row.findIndex(Boolean);
  return index === -1 ? null : index + 1;
}

/**
 * İki satırlı el sıkışma zaman çizelgesini değerlendirir. İlk satır isteği,
 * ikinci satır onayı temsil eder; onay ancak istekten sonraki bir adımda
 * başlarsa sıra doğrudur. Saf motor olduğu için UI ve predicate aynı ölçümü
 * paylaşır.
 */
export function analyzeHandshake(pattern: readonly (readonly boolean[])[]): HandshakeAnalysis {
  const requestStep = firstActiveStep(pattern[0]);
  const acknowledgementStep = firstActiveStep(pattern[1]);
  const complete = requestStep !== null && acknowledgementStep !== null;

  return {
    requestStep,
    acknowledgementStep,
    complete,
    correctOrder: complete && requestStep < acknowledgementStep,
  };
}

/**
 * `analyzeHandshake` sonucunu, kullanıcının "Oynat"tan sonra göreceği
 * Türkçe, sayısal bir özete çevirir: hangi sinyal önce geldi, kaç adım/ms
 * fark var. `requireOrder` yalnız sürümlü `handshake-order` görevinde
 * doğru/yanlış sıra notu ekler; genel kullanımda (iki sinyal, görev yok)
 * sadece gecikmeyi bildirir, "doğru/yanlış" yargısı vermez.
 */
export function describeSignalGap(
  analysis: HandshakeAnalysis,
  signalNames: readonly [string, string],
  stepMs: number,
  requireOrder: boolean,
): string {
  const [firstName, secondName] = signalNames;
  const { requestStep, acknowledgementStep } = analysis;

  if (requestStep === null && acknowledgementStep === null) {
    return `"${firstName}" ve "${secondName}" hiç açılmadı.`;
  }
  if (requestStep === null) {
    return `"${firstName}" hiç açılmadı; "${secondName}" ${acknowledgementStep}. adımda açıldı.`;
  }
  if (acknowledgementStep === null) {
    return `"${secondName}" hiç açılmadı; "${firstName}" ${requestStep}. adımda açıldı.`;
  }
  if (requestStep === acknowledgementStep) {
    return `"${firstName}" ve "${secondName}" aynı adımda (${requestStep}. adım) açıldı — fark yok.`;
  }

  const firstIsEarlier = requestStep < acknowledgementStep;
  const earlierName = firstIsEarlier ? firstName : secondName;
  const laterName = firstIsEarlier ? secondName : firstName;
  const earlierStep = firstIsEarlier ? requestStep : acknowledgementStep;
  const laterStep = firstIsEarlier ? acknowledgementStep : requestStep;
  const gapSteps = laterStep - earlierStep;
  const gapMs = gapSteps * stepMs;

  const orderNote = requireOrder
    ? analysis.correctOrder
      ? " Sıra doğru."
      : ` Sıra ters — önce "${firstName}" açılmalıydı.`
    : "";

  return `"${earlierName}" önce geldi (${earlierStep}. adım), "${laterName}" ${gapSteps} adım (${gapMs} ms) sonra geldi.${orderNote}`;
}
