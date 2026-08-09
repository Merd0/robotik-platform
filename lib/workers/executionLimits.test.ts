import { describe, expect, it } from "vitest";
import { BoundedTextCollector, BoundedTraceCollector } from "./executionLimits";

describe("worker çıktı sınırları", () => {
  it("UTF-8 çıktıyı bayt kotasında keser", () => {
    const collector = new BoundedTextCollector(4, 10);
    collector.push("şşş");
    expect(new TextEncoder().encode(collector.toString()).byteLength).toBe(4);
    expect(collector.truncated).toBe(true);
  });

  it("çıktı olay sayısını sınırlar", () => {
    const collector = new BoundedTextCollector(100, 2);
    collector.push("bir");
    collector.push("iki");
    collector.push("üç");
    expect(collector.toString()).toBe("bir\niki");
    expect(collector.emissions).toBe(2);
    expect(collector.truncated).toBe(true);
  });

  it("eklem izini belirtilen örnek sayısında keser", () => {
    const collector = new BoundedTraceCollector<number>(2);
    collector.push(1);
    collector.push(2);
    collector.push(3);
    expect(collector.values).toEqual([1, 2]);
    expect(collector.truncated).toBe(true);
  });
});
