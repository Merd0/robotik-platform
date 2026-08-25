import { describe, expect, it } from "vitest";
import {
  ROBOT_INTERVIEW_QUESTIONS,
  answerRobotInterviewQuestion,
} from "./robotInterview";
import { genericTwoDofRobot } from "./robots/genericTwoDof";
import { genericSixDofRobot } from "./robots/genericSixDof";
import { meca500R4Robot } from "./robots/meca500R4";
import type { RobotSpec } from "./kinematics";

describe("ROBOT_INTERVIEW_QUESTIONS", () => {
  it("her soru tekil bir id ve boş olmayan bir metin taşır", () => {
    const ids = ROBOT_INTERVIEW_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const question of ROBOT_INTERVIEW_QUESTIONS) {
      expect(question.soru.length).toBeGreaterThan(0);
      expect(question.neden.length).toBeGreaterThan(0);
    }
  });
});

describe("answerRobotInterviewQuestion — kimlik", () => {
  it("gerçek metadata'sı olan bir robot marka/model söyler", () => {
    expect(answerRobotInterviewQuestion(meca500R4Robot, "kimlik")).toContain("Mecademic");
    expect(answerRobotInterviewQuestion(meca500R4Robot, "kimlik")).toContain("Meca500 R4");
  });

  it("jenerik bir robot marka UYDURMAZ, jenerik olduğunu açıkça söyler", () => {
    const answer = answerRobotInterviewQuestion(genericTwoDofRobot, "kimlik");
    expect(answer).not.toMatch(/mecademic|abb|kuka|fanuc/i);
    expect(answer).toMatch(/jenerik/i);
  });
});

describe("answerRobotInterviewQuestion — eksen-sayisi", () => {
  it("gerçek eklem sayısını ve türünü rapor eder", () => {
    expect(answerRobotInterviewQuestion(genericTwoDofRobot, "eksen-sayisi")).toContain("2");
    const sixDof = answerRobotInterviewQuestion(genericSixDofRobot, "eksen-sayisi");
    expect(sixDof).toContain("6");
  });
});

describe("answerRobotInterviewQuestion — erisim", () => {
  it("gerçek üretici metadata'sı varsa onu, kaynağıyla birlikte kullanır", () => {
    const answer = answerRobotInterviewQuestion(meca500R4Robot, "erisim");
    expect(answer).toContain("330");
    expect(answer).toMatch(/mecademic/i);
  });

  it("düz döner zincirde geometriden hesaplanan erişimi 'hesaplanan' diyerek verir", () => {
    const answer = answerRobotInterviewQuestion(genericTwoDofRobot, "erisim");
    const expectedReach = genericTwoDofRobot.joints.reduce((sum, joint) => sum + joint.dhParams.a, 0);
    expect(answer).toContain(expectedReach.toFixed(2));
    expect(answer).toMatch(/hesaplanan/i);
  });

  it("genel (d ofsetli/alpha büküşlü) bir zincirde tek sayı UYDURMAZ", () => {
    const answer = answerRobotInterviewQuestion(genericSixDofRobot, "erisim");
    expect(answer).toMatch(/güvenilir|tek sayı/i);
  });
});

describe("answerRobotInterviewQuestion — en-hizli-eklem", () => {
  it("gerçekten en yüksek maxVelocity'ye sahip eklemi bulur", () => {
    const fastestIndex = meca500R4Robot.joints.reduce(
      (best, joint, index) => (joint.maxVelocity > meca500R4Robot.joints[best].maxVelocity ? index : best),
      0,
    );
    const answer = answerRobotInterviewQuestion(meca500R4Robot, "en-hizli-eklem");
    expect(answer).toContain(`${fastestIndex + 1}`);
  });
});

describe("answerRobotInterviewQuestion — en-dar-limit", () => {
  it("pratikte sürekli dönebilen (çok geniş limitli) eklemleri karşılaştırma dışı bırakır", () => {
    // Meca500 J6 ±36000° — gerçek bir 'dar limit' cevabı bundan etkilenmemeli.
    const answer = answerRobotInterviewQuestion(meca500R4Robot, "en-dar-limit");
    expect(answer).not.toContain("6.");
  });

  it("tüm eklemler pratikte sürekliyse dürüst bir fallback verir", () => {
    const allContinuous: RobotSpec = {
      id: "test-all-continuous",
      displayName: "Test",
      joints: [0, 1].map(() => ({
        type: "revolute" as const,
        dhParams: { a: 0.3, alpha: 0, d: 0, theta: 0 },
        limits: { min: -100 * Math.PI, max: 100 * Math.PI },
        maxVelocity: 1,
      })),
    };
    const answer = answerRobotInterviewQuestion(allContinuous, "en-dar-limit");
    expect(answer.length).toBeGreaterThan(0);
  });
});

describe("answerRobotInterviewQuestion — tekillik", () => {
  it("gerçek Jacobian manipülabilitesini hesaplayıp yorumlar", () => {
    const answer = answerRobotInterviewQuestion(genericTwoDofRobot, "tekillik");
    expect(answer.length).toBeGreaterThan(0);
    expect(answer).toMatch(/tekillik|manipülabilite/i);
  });
});

describe("answerRobotInterviewQuestion — kaynak", () => {
  it("gerçek kaynağı olan robotta yayıncı/başlığı verir", () => {
    expect(answerRobotInterviewQuestion(meca500R4Robot, "kaynak")).toContain("Mecademic");
  });

  it("jenerik robotta kaynak UYDURMAZ, açıkça yok der", () => {
    const answer = answerRobotInterviewQuestion(genericTwoDofRobot, "kaynak");
    expect(answer).toMatch(/kaynak.*yok|jenerik/i);
  });
});
