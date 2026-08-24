import { describe, expect, it } from "vitest";
import {
  ROSETTA_SOURCES,
  ROSETTA_TASKS,
  buildVendorComparison,
} from "./vendorRosetta";

describe("Vendor Rosetta hareket niyeti", () => {
  it("eklem-yolu ve doğrusal-yol için iki sentetik görev sunar", () => {
    expect(ROSETTA_TASKS.map((task) => task.id)).toEqual(["joint-pose", "linear-path"]);
    expect(ROSETTA_TASKS.map((task) => task.intent.motion)).toEqual(["joint", "linear"]);
  });

  it("aynı pose niyetini ABB ve Mecademic'in farklı komut modellerine taşır", () => {
    const comparison = buildVendorComparison("joint-pose");

    expect(comparison.outputs.abb.lines).toContain(
      "MoveJ pHedef, v100, fine, toolLab \\WObj:=wobjLab;",
    );
    expect(comparison.outputs.mecademic.lines).toEqual(expect.arrayContaining([
      "SetWrf(500,0,0,0,0,0)",
      "SetTrf(0,0,120,0,0,0)",
      "SetJointVel(25)",
      "SetBlending(0)",
      "MovePose(400,120,300,180,0,90)",
    ]));
    expect(comparison.execution).toBe("read-only");
  });

  it("doğrusal harekette yol türünü korur ama blend değerlerini eşdeğer saymaz", () => {
    const comparison = buildVendorComparison("linear-path");

    expect(comparison.outputs.abb.lines.at(-1)).toBe(
      "MoveL pHedef, v100, z10, toolLab \\WObj:=wobjLab;",
    );
    expect(comparison.outputs.mecademic.lines).toContain(
      "MoveLin(400,120,300,180,0,90)",
    );
    expect(comparison.differences.find((row) => row.id === "blend")).toMatchObject({
      equivalent: false,
    });
  });

  it("hedef, çerçeve, hız, blend ve tool farklarını görünür satırlara ayırır", () => {
    const comparison = buildVendorComparison("linear-path");

    expect(comparison.differences.map((row) => row.id)).toEqual([
      "target",
      "frame",
      "speed",
      "blend",
      "tool",
    ]);
    expect(comparison.differences.every((row) => row.abb.length > 0 && row.mecademic.length > 0)).toBe(true);
    expect(comparison.screenReaderSummary).toContain("birebir çeviri değildir");
  });

  it("her üretici iddiasını sürümlü resmî kaynağa bağlar", () => {
    expect(ROSETTA_SOURCES.abb).toMatchObject({
      publisher: "ABB",
      document: expect.stringContaining("3HAC050917-001"),
    });
    expect(ROSETTA_SOURCES.mecademic).toMatchObject({
      publisher: "Mecademic",
      document: expect.stringContaining("Firmware 11.3"),
    });
    expect(ROSETTA_SOURCES.abb.url).toMatch(/^https:\/\/library\.e\.abb\.com\//);
    expect(ROSETTA_SOURCES.mecademic.url).toMatch(/^https:\/\/resources\.mecademic\.com\//);
  });
});
