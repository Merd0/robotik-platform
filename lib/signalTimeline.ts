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
