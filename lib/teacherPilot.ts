import { encodeLabState, type IkTargetLabState } from "./labState";
import { SITE_URL } from "./seo";

export const TEACHER_PILOT_LESSON_SLUG = "b-lise-geometrik-ters-kinematik";

export const TEACHER_PILOT_LAB_STATE: IkTargetLabState = {
  kind: "ik-target",
  version: 1,
  robotId: "generic-2dof",
  target: { x: 0.9, y: 0.3 },
  elbow: "up",
  solver: "analytical",
};

/** Öğrenciye verilecek tek, önceden ayarlanmış ve hesapsız pilot bağlantısı. */
export const TEACHER_PILOT_TASK_URL = `${SITE_URL}/ders/${TEACHER_PILOT_LESSON_SLUG}#lab=${encodeLabState(TEACHER_PILOT_LAB_STATE)}`;
