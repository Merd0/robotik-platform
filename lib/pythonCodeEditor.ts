export interface RobotApiCompletion {
  label: string;
  apply: string;
  detail: string;
  info: string;
}

/**
 * Tarayıcıdaki Python köprüsünün belgeli, küçük API yüzeyi. Editör bu
 * listeyi yalnız `robot.` sonrasında önerir; Python'ın tamamını taklit eden
 * ağır bir dil sunucusu değildir.
 */
export const ROBOT_API_COMPLETIONS: readonly RobotApiCompletion[] = [
  {
    label: "movej",
    apply: "movej([])",
    detail: "([açı, ...])",
    info: "Robotu derece cinsinden verilen eklem açılarına götürür.",
  },
  {
    label: "movel",
    apply: "movel(x, y, z)",
    detail: "(x, y, z, speed=None)",
    info: "TCP için metre cinsinden Kartezyen hedef çözer.",
  },
  {
    label: "get_tcp",
    apply: "get_tcp()",
    detail: "() → Pose",
    info: "Geçerli TCP konumunu x, y ve z alanlarıyla döndürür.",
  },
  {
    label: "get_joints",
    apply: "get_joints()",
    detail: "() → list",
    info: "Geçerli eklem açılarını derece cinsinden döndürür.",
  },
  {
    label: "forward_kinematics",
    apply: "forward_kinematics([])",
    detail: "([açı, ...]) → Pose",
    info: "Eklem açılarından TCP konumunu hesaplar.",
  },
  {
    label: "inverse_kinematics",
    apply: "inverse_kinematics(x, y, z)",
    detail: "(x, y, z) → list",
    info: "Bir TCP hedefi için geçerli eklem açıları arar.",
  },
  {
    label: "eklem_ac",
    apply: "eklem_ac(index, derece)",
    detail: "(index, derece)",
    info: "Başlangıç derslerindeki tek eklem komutudur.",
  },
  {
    label: "hedefe_git",
    apply: "hedefe_git(x, y)",
    detail: "(x, y) → bool",
    info: "İki eklemli robotu düzlemsel hedefe götürmeyi dener.",
  },
] as const;

export interface RobotCompletionPrefix {
  /** `robot.` sonrasındaki üye adının başladığı karakter konumu. */
  from: number;
  prefix: string;
}

/** İmlecin hemen önünde `robot.<üye>` varsa tamamlanacak aralığı döndürür. */
export function robotCompletionPrefix(code: string, cursor: number): RobotCompletionPrefix | null {
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > code.length) return null;
  const beforeCursor = code.slice(0, cursor);
  const match = /(?:^|[^\w])robot\.([A-Za-z_]*)$/.exec(beforeCursor);
  if (!match) return null;

  const prefix = match[1];
  return { from: cursor - prefix.length, prefix };
}

/**
 * Pyodide, SyntaxError konumunu kullanıcı kodunun sanal dosya adıyla verir.
 * Dahili Pyodide/Python dosyalarındaki satırlar özellikle eşleştirilmez.
 */
export function findPythonErrorLine(error: string | null, lineCount: number): number | null {
  if (!error || !Number.isSafeInteger(lineCount) || lineCount < 1) return null;
  const match = /<robotik-lab>["']?\s*,\s*line\s+(\d+)/i.exec(error);
  if (!match) return null;

  const line = Number(match[1]);
  return Number.isSafeInteger(line) && line >= 1 && line <= lineCount ? line : null;
}
