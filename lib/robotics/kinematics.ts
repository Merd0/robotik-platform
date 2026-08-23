import { dhTransform, multiply, identity, translationOf, type Mat4, type Vec3 } from "./transform";

export type JointType = "revolute" | "prismatic";

export interface JointSpec {
  type: JointType;
  dhParams: { a: number; alpha: number; d: number; theta: number };
  limits: { min: number; max: number };
  maxVelocity: number;
}

export type RobotMetadataSourceKind = "official-doc" | "software-doc" | "book" | "paper" | "standard" | "dataset" | "other";

/**
 * `lib/content.ts`teki ders `SourceRef`iyle aynı alan adlarını taşır ama
 * kasıtlı olarak burada AYRI tanımlı — bu dosya fs'e dokunan content.ts'i
 * import etmez (bkz. lib/robotics/CLAUDE.md: "asla window/document/React'e
 * özel import girmez", mobil port saflığı).
 */
export interface RobotMetadataSource {
  kind: RobotMetadataSourceKind;
  title: string;
  publisher?: string;
  url?: string;
  version?: string;
  accessedAt?: string;
}

/**
 * Yalnız GERÇEK, kaynak gösterilebilir bir üretici ürününe karşılık gelen
 * robotlarda doldurulur (bkz. docs/02-mimari.md "1. Robot tanımı"). Bu
 * platformdaki jenerik katalog robotları (generic-2dof, generic-prismatic,
 * generic-6dof) ve kullanıcı tanımlı `custom-robot` örnekleri bu alanı asla
 * taşımaz — DH parametreleri gerçek bir üretici modeline dayanmıyor,
 * metadata eklemek yanlış özdeşleştirme (uydurma marka iddiası) olurdu.
 */
export interface RobotMetadata {
  manufacturer: string;
  model: string;
  /** Üreticinin veri sayfasında yayınladığı azami erişim (mm). Robotun kendi
   * DH toplamından türetilmiş bir tahmin DEĞİL — kaynaktaki sayı. */
  maxReachMm?: number;
  /** Üreticinin veri sayfasında yayınladığı azami payload (kg). Bu platform
   * yük/dinamik modellemez (bkz. "kinematik dijital prova" sınırı) — alan
   * yalnız bilgi amaçlı gösterilir, hesaplamaya girmez. */
  payloadKg?: number;
  /** Ürünün gerçek görseline/üretici sayfasına referans; dosya bu repoya
   * gömülmez (harici CDN yasağı, bkz. docs/08) — yalnız üreticinin kendi
   * sayfasına bağlantı. */
  imageUrl?: string;
  source: RobotMetadataSource;
}

export interface RobotSpec {
  id: string;
  displayName: string;
  joints: JointSpec[];
  meshUrl?: string;
  /** bkz. RobotMetadata dokümantasyonu — opsiyonel, geriye dönük uyumlu. */
  metadata?: RobotMetadata;
}

export interface ForwardKinematicsResult {
  /** Her eklemin ucundaki çerçevenin dünya konumu, taban dahil (index 0 = taban). */
  jointPositions: Vec3[];
  /** Her eklemin ucundaki tam dönüşüm matrisi. */
  jointTransforms: Mat4[];
  endEffector: Vec3;
}

/**
 * DH tabanlı ileri kinematik. jointAngles, her eklemin dhParams'taki theta/d
 * değerine EKLENEN canlı değişkendir (theta offset'i değil, joint'in
 * kendisidir) — bu yüzden statik robot tanımındaki theta/d "sıfır konumu"
 * (home offset), jointAngles ise kaydırıcıdan gelen anlık değerdir.
 */
export function forwardKinematics(robot: RobotSpec, jointAngles: number[]): ForwardKinematicsResult {
  if (jointAngles.length !== robot.joints.length) {
    throw new Error(
      `Eklem açısı sayısı (${jointAngles.length}) robotun eklem sayısıyla (${robot.joints.length}) eşleşmiyor.`,
    );
  }

  const jointTransforms: Mat4[] = [];
  const jointPositions: Vec3[] = [{ x: 0, y: 0, z: 0 }];

  let accumulated: Mat4 = identity();
  robot.joints.forEach((joint, index) => {
    const angle = jointAngles[index];
    const { a, alpha, d, theta } = joint.dhParams;
    const effectiveTheta = joint.type === "revolute" ? theta + angle : theta;
    const effectiveD = joint.type === "prismatic" ? d + angle : d;

    const step = dhTransform(a, alpha, effectiveD, effectiveTheta);
    accumulated = multiply(accumulated, step);
    jointTransforms.push(accumulated);
    jointPositions.push(translationOf(accumulated));
  });

  return {
    jointPositions,
    jointTransforms,
    endEffector: jointPositions[jointPositions.length - 1],
  };
}

function withinLimits(robot: RobotSpec, angles: number[]): boolean {
  return robot.joints.every((joint, i) => angles[i] >= joint.limits.min && angles[i] <= joint.limits.max);
}

export type Elbow = "up" | "down";

export interface AnalyticalTwoDofDebug {
  a1: number;
  a2: number;
  /** Hedefin taban merkezine uzaklığının karesi: x² + y². */
  r2: number;
  /** Kosinüs teoreminden: (r² − a1² − a2²) / (2·a1·a2). [-1, 1] dışındaysa hedef erişim dışıdır. */
  cosTheta2: number;
  reachable: boolean;
}

/**
 * `inverseKinematicsAnalytical2Dof`in kullandığı ara değerleri (a1, a2, r²,
 * cos θ2) dışarı açar — Mühendislik modunun (Faz 7) gösterdiği sayılar bu
 * fonksiyonun İÇİNDE ikinci kez elle yazılmaz, tek kaynaktan gelir.
 */
export function analyticalTwoDofDebug(robot: RobotSpec, target: { x: number; y: number }): AnalyticalTwoDofDebug {
  if (robot.joints.length !== 2) {
    throw new Error("Analitik 2-DOF debug bilgisi sadece iki eklemli düzlemsel kollar için tanımlı.");
  }
  const a1 = robot.joints[0].dhParams.a;
  const a2 = robot.joints[1].dhParams.a;
  const r2 = target.x * target.x + target.y * target.y;
  const cosTheta2 = (r2 - a1 * a1 - a2 * a2) / (2 * a1 * a2);
  return { a1, a2, r2, cosTheta2, reachable: cosTheta2 >= -1 && cosTheta2 <= 1 };
}

/**
 * İki eklemli düzlemsel kol için kapalı form (analitik) ters kinematik.
 * Kosinüs teoremiyle theta2, sonra theta1 çözülür — iki çözüm ("dirsek
 * yukarı"/"dirsek aşağı") cos(theta2)'nin işaretinden değil, sin(theta2)'nin
 * işaretinden gelir. Bkz. docs/04-icerik-rehberi.md lise seviyesi örneği.
 */
export function inverseKinematicsAnalytical2Dof(
  robot: RobotSpec,
  target: { x: number; y: number },
  elbow: Elbow = "up",
): number[] | null {
  const { a1, a2, cosTheta2, reachable } = analyticalTwoDofDebug(robot, target);
  if (!reachable) return null;

  const sinTheta2Magnitude = Math.sqrt(1 - cosTheta2 * cosTheta2);
  const theta2 =
    elbow === "up"
      ? Math.atan2(sinTheta2Magnitude, cosTheta2)
      : Math.atan2(-sinTheta2Magnitude, cosTheta2);
  const theta1 =
    Math.atan2(target.y, target.x) - Math.atan2(a2 * Math.sin(theta2), a1 + a2 * Math.cos(theta2));

  const angles = [theta1, theta2];
  return withinLimits(robot, angles) ? angles : null;
}

// --- Jacobian ---------------------------------------------------------

export interface JacobianResult {
  /** Her eklem için dünya çerçevesinde doğrusal hız Jacobian sütunu. */
  columns: Vec3[];
  /** Yoshikawa manipülabilite ölçüsü: sqrt(det(J J^T)). Sıfıra yaklaşınca tekillik. */
  manipulability: number;
}

function crossProduct(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function subtractVec(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function zAxisOf(m: Mat4): Vec3 {
  return { x: m[0][2], y: m[1][2], z: m[2][2] };
}

const WORLD_Z: Vec3 = { x: 0, y: 0, z: 1 };

type Mat3 = [[number, number, number], [number, number, number], [number, number, number]];

function jjtMatrix(columns: Vec3[]): Mat3 {
  const axes: (keyof Vec3)[] = ["x", "y", "z"];
  return axes.map((a) =>
    axes.map((b) => columns.reduce((sum, col) => sum + col[a] * col[b], 0)),
  ) as Mat3;
}

function mat3Determinant(m: Mat3): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function mat3AddDiagonal(m: Mat3, value: number): Mat3 {
  return [
    [m[0][0] + value, m[0][1], m[0][2]],
    [m[1][0], m[1][1] + value, m[1][2]],
    [m[2][0], m[2][1], m[2][2] + value],
  ];
}

/** Adjugate/determinant yöntemiyle 3x3 matris tersi. */
function mat3Inverse(m: Mat3): Mat3 {
  const det = mat3Determinant(m);
  const cofactor = (r0: number, r1: number, c0: number, c1: number) =>
    m[r0][c0] * m[r1][c1] - m[r0][c1] * m[r1][c0];

  const adjugateTransposed: Mat3 = [
    [cofactor(1, 2, 1, 2), -cofactor(0, 2, 1, 2), cofactor(0, 1, 1, 2)],
    [-cofactor(1, 2, 0, 2), cofactor(0, 2, 0, 2), -cofactor(0, 1, 0, 2)],
    [cofactor(1, 2, 0, 1), -cofactor(0, 2, 0, 1), cofactor(0, 1, 0, 1)],
  ];

  return adjugateTransposed.map((row) => row.map((value) => value / det)) as Mat3;
}

function mat3TimesVec3(m: Mat3, v: Vec3): Vec3 {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  };
}

/**
 * Geometrik Jacobian (sadece doğrusal hız kısmı; yönelim izlenmiyor).
 * Eklem i'nin ekseni "çerçeve i-1"in Z ekseni, o çerçevenin orijininde —
 * bkz. Lynch & Park, Modern Robotics, Bölüm 5.
 */
export function computeJacobian(robot: RobotSpec, jointAngles: number[]): JacobianResult {
  const { jointPositions, jointTransforms } = forwardKinematics(robot, jointAngles);
  const endEffector = jointPositions[jointPositions.length - 1];

  const columns = robot.joints.map((joint, index) => {
    const framePrevOrigin = jointPositions[index];
    const framePrevZ = index === 0 ? WORLD_Z : zAxisOf(jointTransforms[index - 1]);

    if (joint.type === "prismatic") return framePrevZ;
    return crossProduct(framePrevZ, subtractVec(endEffector, framePrevOrigin));
  });

  return { columns, manipulability: manipulabilityOf(columns) };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** n×n matris için kofaktör açılımıyla determinant (n küçük olduğu sürece, eklem sayısı gibi). */
function determinant(matrix: number[][]): number {
  const n = matrix.length;
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let result = 0;
  for (let col = 0; col < n; col++) {
    const minor = matrix.slice(1).map((row) => row.filter((_, c) => c !== col));
    result += (col % 2 === 0 ? 1 : -1) * matrix[0][col] * determinant(minor);
  }
  return result;
}

/**
 * Yoshikawa manipülabilitesi. Eklem sayısı (n) konum boyutundan (3) azsa
 * J J^T (3x3) her zaman tekildir (rank ≤ n < 3) — bu yüzden n <= 3 iken
 * Gram matrisi J^T J (n×n) kullanılır; n > 3 (fazladan eklemli/redundant
 * kol) olursa klasik J J^T (3x3) kullanılır.
 */
function manipulabilityOf(columns: Vec3[]): number {
  const n = columns.length;
  if (n === 0) return 0;
  if (n <= 3) {
    const gram = columns.map((a) => columns.map((b) => dot(a, b)));
    return Math.sqrt(Math.max(determinant(gram), 0));
  }
  return Math.sqrt(Math.max(mat3Determinant(jjtMatrix(columns)), 0));
}

export const SINGULARITY_THRESHOLD = 1e-3;

export function isNearSingularity(manipulability: number): boolean {
  return manipulability < SINGULARITY_THRESHOLD;
}

// --- Sayısal (genel) ters kinematik -----------------------------------

export interface NumericalIkOptions {
  maxIterations?: number;
  tolerance?: number;
  damping?: number;
  /** Tek iterasyonda izin verilen en büyük açı adımı (radyan). */
  maxStep?: number;
  initialGuess?: number[];
  /** Verildiğinde TCP konumuyla birlikte takım yönelimini de bu çerçeveye kilitler. */
  targetOrientation?: Mat4;
  orientationTolerance?: number;
}

export interface NumericalIkResult {
  angles: number[] | null;
  converged: boolean;
  iterations: number;
  finalError: number;
  trace: NumericalIkIteration[];
}

export interface NumericalIkIteration {
  iteration: number;
  errorNorm: number;
  angles: number[];
}

function projectRevoluteAngleToLimits(angle: number, min: number, max: number): number {
  const normalized = normalizeAngle(angle);
  const twoPi = 2 * Math.PI;
  const equivalentInside = [normalized, normalized - twoPi, normalized + twoPi]
    .filter((candidate) => candidate >= min && candidate <= max)
    .sort((first, second) => Math.abs(first - angle) - Math.abs(second - angle))[0];
  if (equivalentInside !== undefined) return equivalentInside;
  return Math.min(max, Math.max(min, normalized));
}

function rotationAxis(transform: Mat4, column: number): Vec3 {
  return { x: transform[0][column], y: transform[1][column], z: transform[2][column] };
}

function orientationError(current: Mat4, target: Mat4): Vec3 {
  const errors = [0, 1, 2].map((column) => crossProduct(
    rotationAxis(current, column),
    rotationAxis(target, column),
  ));
  return {
    x: 0.5 * errors.reduce((sum, error) => sum + error.x, 0),
    y: 0.5 * errors.reduce((sum, error) => sum + error.y, 0),
    z: 0.5 * errors.reduce((sum, error) => sum + error.z, 0),
  };
}

function inverseMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_, columnIndex) => rowIndex === columnIndex ? 1 : 0),
  ]);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) pivotRow = row;
    }
    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];
    const pivot = augmented[column][column];
    if (Math.abs(pivot) < 1e-12) throw new Error("Sönümlü IK matrisi terslenemedi.");
    augmented[column] = augmented[column].map((value) => value / pivot);
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index]);
    }
  }
  return augmented.map((row) => row.slice(size));
}

function dampedLeastSquares(jacobianRows: number[][], error: number[], damping: number): number[] {
  const rowCount = jacobianRows.length;
  const columnCount = jacobianRows[0]?.length ?? 0;
  const jjt = Array.from({ length: rowCount }, (_, row) =>
    Array.from({ length: rowCount }, (_, column) =>
      jacobianRows[row].reduce((sum, value, index) => sum + value * jacobianRows[column][index], 0)
      + (row === column ? damping * damping : 0),
    ),
  );
  const inverse = inverseMatrix(jjt);
  const intermediate = inverse.map((row) => row.reduce((sum, value, index) => sum + value * error[index], 0));
  return Array.from({ length: columnCount }, (_, column) =>
    jacobianRows.reduce((sum, row, index) => sum + row[column] * intermediate[index], 0),
  );
}

/**
 * Sönümlü en küçük kareler (damped least squares) ile sayısal ters kinematik.
 * dtheta = J^T (J J^T + lambda^2 I)^-1 * hata. Tekillik yakınında da kararlı
 * kalır çünkü lambda, J J^T'yi tersine çevrilemez olmaktan çıkarır —
 * bkz. docs/01-mufredat.md "sayısal ters kinematik".
 */
export function inverseKinematicsNumerical(
  robot: RobotSpec,
  target: Vec3,
  options: NumericalIkOptions = {},
): NumericalIkResult {
  const maxIterations = options.maxIterations ?? 100;
  const tolerance = options.tolerance ?? 1e-4;
  const orientationTolerance = options.orientationTolerance ?? 0.01;
  const damping = options.damping ?? 0.05;

  const projectToLimits = (angle: number, index: number) => {
    const joint = robot.joints[index];
    if (joint.type === "revolute") {
      return projectRevoluteAngleToLimits(angle, joint.limits.min, joint.limits.max);
    }
    return Math.min(joint.limits.max, Math.max(joint.limits.min, angle));
  };
  let angles = (options.initialGuess ? [...options.initialGuess] : robot.joints.map(() => 0.1))
    .map(projectToLimits);
  const trace: NumericalIkIteration[] = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const { jointPositions, jointTransforms } = forwardKinematics(robot, angles);
    const current = jointPositions[jointPositions.length - 1];
    const error = subtractVec(target, current);
    const errorNorm = Math.hypot(error.x, error.y, error.z);
    const rotationError = options.targetOrientation
      ? orientationError(jointTransforms.at(-1)!, options.targetOrientation)
      : { x: 0, y: 0, z: 0 };
    const rotationErrorNorm = Math.hypot(rotationError.x, rotationError.y, rotationError.z);
    trace.push({ iteration, errorNorm, angles: [...angles] });

    if (errorNorm < tolerance && rotationErrorNorm < orientationTolerance) {
      if (!withinLimits(robot, angles)) return { angles: null, converged: false, iterations: iteration, finalError: errorNorm, trace };
      return { angles, converged: true, iterations: iteration, finalError: errorNorm, trace };
    }

    const { columns } = computeJacobian(robot, angles);
    const dtheta = options.targetOrientation
      ? (() => {
        const angularColumns = robot.joints.map((joint, index) => {
          if (joint.type === "prismatic") return { x: 0, y: 0, z: 0 };
          return index === 0 ? WORLD_Z : zAxisOf(jointTransforms[index - 1]);
        });
        return dampedLeastSquares([
          columns.map((column) => column.x),
          columns.map((column) => column.y),
          columns.map((column) => column.z),
          angularColumns.map((column) => column.x),
          angularColumns.map((column) => column.y),
          angularColumns.map((column) => column.z),
        ], [error.x, error.y, error.z, rotationError.x, rotationError.y, rotationError.z], damping);
      })()
      : (() => {
        const damped = mat3AddDiagonal(jjtMatrix(columns), damping * damping);
        const y = mat3TimesVec3(mat3Inverse(damped), error);
        return columns.map((col) => col.x * y.x + col.y * y.y + col.z * y.z);
      })();

    // Adım boyu kırpma: büyük başlangıç hatalarında tek adımda aşırı sıçrama
    // olmasın diye (aksi halde iki nokta arasında sonsuz salınabilir).
    const dthetaNorm = Math.hypot(...dtheta);
    const maxStep = options.maxStep ?? 0.3;
    const scale = dthetaNorm > maxStep ? maxStep / dthetaNorm : 1;

    angles = angles.map((angle, i) => projectToLimits(angle + dtheta[i] * scale, i));
  }

  const finalPosition = forwardKinematics(robot, angles).endEffector;
  const finalError = Math.hypot(target.x - finalPosition.x, target.y - finalPosition.y, target.z - finalPosition.z);
  return { angles: null, converged: false, iterations: maxIterations, finalError, trace };
}

/** Açıyı (-π, π] aralığına indirger; dönel eklemler için limit kontrolü bu aralığa göre tanımlı. */
function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  const wrapped = ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
}
