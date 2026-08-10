import { describe, expect, it } from "vitest";
import { HERO_JOINTS, HERO_TARGET, heroPose } from "./heroKinematics";

const sweep = (adet = 200) => Array.from({ length: adet + 1 }, (_, index) => (index * 100) / adet);

describe("tek kaydırıcıyla iki eklemli kontrol devri", () => {
  it("komut başındayken yalnız omuz başlangıç açısındadır", () => {
    const pose = heroPose(0);
    expect(pose.q1).toBeCloseTo(HERO_JOINTS.shoulder.start, 6);
    expect(pose.q2).toBeCloseTo(HERO_JOINTS.elbow.rest, 6);
    expect(pose.activeJoint).toBe("omuz");
    expect(pose.shoulderAtLimit).toBe(false);
  });

  it("devir noktasında omuz limitindedir ama dirsek henüz kımıldamamıştır", () => {
    const pose = heroPose(HERO_JOINTS.handoffAt);
    expect(pose.q1).toBeCloseTo(HERO_JOINTS.shoulder.limit, 6);
    expect(pose.q2).toBeCloseTo(HERO_JOINTS.elbow.rest, 6);
    expect(pose.shoulderAtLimit).toBe(true);
    expect(pose.activeJoint).toBe("dirsek");
  });

  it("komut sonunda uç, hedefin tam üstündedir", () => {
    const pose = heroPose(100);
    expect(pose.q1).toBeCloseTo(HERO_JOINTS.shoulder.limit, 6);
    expect(pose.q2).toBeCloseTo(HERO_JOINTS.elbow.limit, 6);
    expect(pose.distanceToTarget).toBeCloseTo(0, 6);
    expect(pose.end.x).toBeCloseTo(HERO_TARGET.x, 6);
    expect(pose.end.y).toBeCloseTo(HERO_TARGET.y, 6);
  });

  /*
   * Sahnenin öğrettiği asıl ayrım: omuz yönü değiştirir, uzanımı değil.
   * Bu iki test o iddiayı sayısal olarak bağlar — metin değişse bile
   * geometri bu davranışı korumak zorunda.
   */
  it("omuz evresinde uzanım değişmez: tek dönme eklemi ucu daire üzerinde gezdirir", () => {
    const baslangic = heroPose(0).reach;
    for (const command of sweep().filter((value) => value <= HERO_JOINTS.handoffAt)) {
      expect(heroPose(command).reach).toBeCloseTo(baslangic, 6);
    }
  });

  it("devirden sonra uzanım kesintisiz büyür", () => {
    const devirdenSonra = sweep().filter((value) => value >= HERO_JOINTS.handoffAt);
    for (let index = 1; index < devirdenSonra.length; index += 1) {
      expect(heroPose(devirdenSonra[index]).reach).toBeGreaterThan(heroPose(devirdenSonra[index - 1]).reach);
    }
    expect(heroPose(100).reach).toBeGreaterThan(heroPose(HERO_JOINTS.handoffAt).reach * 1.5);
  });

  it("hedefe uzaklık komut boyunca hiç artmadan sıfıra iner", () => {
    const komutlar = sweep();
    for (let index = 1; index < komutlar.length; index += 1) {
      const onceki = heroPose(komutlar[index - 1]).distanceToTarget;
      const simdiki = heroPose(komutlar[index]).distanceToTarget;
      expect(simdiki).toBeLessThan(onceki);
    }
  });

  it("omuz tek başına hedefe varamaz: devir noktasında hâlâ belirgin bir açık vardır", () => {
    expect(heroPose(HERO_JOINTS.handoffAt).distanceToTarget).toBeGreaterThan(40);
  });

  it("aralık dışı komut kırpılır", () => {
    expect(heroPose(-30).q1).toBeCloseTo(heroPose(0).q1, 6);
    expect(heroPose(180).q2).toBeCloseTo(heroPose(100).q2, 6);
  });
});
