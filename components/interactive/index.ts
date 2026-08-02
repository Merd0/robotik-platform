import { JointSliders } from "./JointSliders";
import { IkTarget } from "./IkTarget";
import { JacobianViz } from "./JacobianViz";
import { PlannerRace } from "./PlannerRace";
import { CodeRunner } from "./CodeRunner";
import { Quiz } from "./Quiz";

/**
 * MDX'e açılan bileşenlerin TEK listesi. Bir ders dosyası burada olmayan bir
 * bileşeni kullanamaz — bkz. CLAUDE.md "içerikte sadece önceden tanımlı
 * components/interactive/ bileşenleri kullanılır".
 */
export const mdxComponents = {
  JointSliders,
  IkTarget,
  JacobianViz,
  PlannerRace,
  CodeRunner,
  Quiz,
};
