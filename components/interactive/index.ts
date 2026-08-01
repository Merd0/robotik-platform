import { JointSliders } from "./JointSliders";
import { IkTarget } from "./IkTarget";
import { JacobianViz } from "./JacobianViz";
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
  Quiz,
};
