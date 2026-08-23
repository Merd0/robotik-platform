import { describe, expect, it } from "vitest";
import {
  ROBOT_API_COMPLETIONS,
  findPythonErrorLine,
  robotCompletionPrefix,
} from "./pythonCodeEditor";

describe("Python kod editörü", () => {
  it("Pyodide kullanıcı kodu konumundan hata satırını çıkarır", () => {
    expect(
      findPythonErrorLine(
        'File "<robotik-lab>", line 3\n    robot.movej([45, -30]\nSyntaxError: closing parenthesis',
        4,
      ),
    ).toBe(3);
    expect(findPythonErrorLine("SyntaxError: geçersiz sözdizimi (<robotik-lab>, line 2)", 2)).toBe(2);
  });

  it("kullanıcı koduna ait olmayan veya aralık dışı satırları vurgulamaz", () => {
    expect(findPythonErrorLine('File "_pyodide/_base.py", line 10', 12)).toBeNull();
    expect(findPythonErrorLine('File "<robotik-lab>", line 9', 3)).toBeNull();
    expect(findPythonErrorLine(null, 3)).toBeNull();
  });

  it("tamamlamayı yalnız robot API üyesi yazılırken açar", () => {
    expect(robotCompletionPrefix("robot.mov", 9)).toEqual({ from: 6, prefix: "mov" });
    expect(robotCompletionPrefix("print(robot.get_", 16)).toEqual({ from: 12, prefix: "get_" });
    expect(robotCompletionPrefix("hareket = mov", 13)).toBeNull();
  });

  it("temel ve ileri robot API çağrılarını belgeli tamamlamalar olarak sunar", () => {
    expect(ROBOT_API_COMPLETIONS.map((completion) => completion.label)).toEqual(
      expect.arrayContaining([
        "movej",
        "movel",
        "get_tcp",
        "get_joints",
        "forward_kinematics",
        "inverse_kinematics",
        "eklem_ac",
        "hedefe_git",
      ]),
    );
    expect(ROBOT_API_COMPLETIONS.every((completion) => completion.detail && completion.info)).toBe(true);
  });
});
