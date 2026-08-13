/**
 * Tüm 3D sahnelerin tek giriş noktası.
 *
 * Neden tek dosya: `LazyScene.tsx` içindeki `dynamic()` çağrılarının hepsi
 * BURAYA baktığı için derleyici tek bir tembel parça (chunk) üretiyor. Her
 * sahne kendi dosyasından ayrı ayrı dynamic-import edildiğinde `three` her
 * parçaya yeniden kopyalanıyordu — ölçüldü: iki ayrı parçada birebir aynı
 * 900 KB'lık three.js gövdesi. İki farklı sahne kullanan bir ders sayfası
 * bunu iki kez indirip iki kez çalıştırıyordu.
 */
export { RobotArm } from "./RobotArm";
export { PlanningGrid } from "./PlanningGrid";
export { JacobianScene } from "./JacobianScene";
export { RobotCellScene } from "./RobotCellScene";
