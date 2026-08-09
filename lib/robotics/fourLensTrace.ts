export interface TraceProgramStep {
  line: number;
  code: string;
  jointDegrees: [number, number];
}

export interface FourLensSample extends TraceProgramStep {
  jointRadians: [number, number];
  elbow: { x: number; y: number };
  end: { x: number; y: number };
  endTransform: number[][];
}

export const FORWARD_KINEMATICS_PROGRAM: TraceProgramStep[] = [
  { line: 1, code: "q = [0, 0]", jointDegrees: [0, 0] },
  { line: 2, code: "q[0] = 30", jointDegrees: [30, 0] },
  { line: 3, code: "q[1] = 45", jointDegrees: [30, 45] },
  { line: 4, code: "q[0] = 75", jointDegrees: [75, 45] },
];

const toRadians = (degrees: number) => degrees * Math.PI / 180;

export function createFourLensTrace(
  program: readonly TraceProgramStep[] = FORWARD_KINEMATICS_PROGRAM,
  links: readonly [number, number] = [1, 0.8],
): FourLensSample[] {
  return program.map((step) => {
    const q1 = toRadians(step.jointDegrees[0]);
    const q2 = toRadians(step.jointDegrees[1]);
    const total = q1 + q2;
    const elbow = { x: links[0] * Math.cos(q1), y: links[0] * Math.sin(q1) };
    const end = {
      x: elbow.x + links[1] * Math.cos(total),
      y: elbow.y + links[1] * Math.sin(total),
    };
    const c = Math.cos(total);
    const s = Math.sin(total);
    return {
      ...step,
      jointRadians: [q1, q2],
      elbow,
      end,
      endTransform: [
        [c, -s, 0, end.x],
        [s, c, 0, end.y],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
    };
  });
}

export function finalXDirection(trace: readonly FourLensSample[]): "increase" | "decrease" | "same" {
  if (trace.length < 2) return "same";
  const delta = trace[trace.length - 1].end.x - trace[trace.length - 2].end.x;
  if (Math.abs(delta) < 1e-9) return "same";
  return delta > 0 ? "increase" : "decrease";
}
