export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Row-major 4x4 homojen dönüşüm matrisi. */
export type Mat4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

export function identity(): Mat4 {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

export function multiply(a: Mat4, b: Mat4): Mat4 {
  const result: number[][] = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[row][k] * b[k][col];
      result[row][col] = sum;
    }
  }
  return result as unknown as Mat4;
}

export function multiplyAll(matrices: Mat4[]): Mat4 {
  return matrices.reduce((acc, m) => multiply(acc, m), identity());
}

export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  return {
    x: m[0][0] * p.x + m[0][1] * p.y + m[0][2] * p.z + m[0][3],
    y: m[1][0] * p.x + m[1][1] * p.y + m[1][2] * p.z + m[1][3],
    z: m[2][0] * p.x + m[2][1] * p.y + m[2][2] * p.z + m[2][3],
  };
}

/** m'in öteleme (son sütun) bileşenini Vec3 olarak döndürür. */
export function translationOf(m: Mat4): Vec3 {
  return { x: m[0][3], y: m[1][3], z: m[2][3] };
}

export function translation(x: number, y: number, z: number): Mat4 {
  return [
    [1, 0, 0, x],
    [0, 1, 0, y],
    [0, 0, 1, z],
    [0, 0, 0, 1],
  ];
}

export function rotationX(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1],
  ];
}

export function rotationY(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [c, 0, s, 0],
    [0, 1, 0, 0],
    [-s, 0, c, 0],
    [0, 0, 0, 1],
  ];
}

export function rotationZ(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [
    [c, -s, 0, 0],
    [s, c, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

/**
 * Klasik (standart) Denavit-Hartenberg dönüşümü: çerçeve i-1'den çerçeve i'ye.
 * Sıra: Z ekseninde theta dönüşü + d ötelemesi, sonra X ekseninde a ötelemesi + alpha dönüşü.
 */
export function dhTransform(a: number, alpha: number, d: number, theta: number): Mat4 {
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const cosAlpha = Math.cos(alpha);
  const sinAlpha = Math.sin(alpha);

  return [
    [cosTheta, -sinTheta * cosAlpha, sinTheta * sinAlpha, a * cosTheta],
    [sinTheta, cosTheta * cosAlpha, -cosTheta * sinAlpha, a * sinTheta],
    [0, sinAlpha, cosAlpha, d],
    [0, 0, 0, 1],
  ];
}
