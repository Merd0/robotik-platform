"use client";

import { useState } from "react";
import {
  answerRobotInterviewQuestion,
  ROBOT_INTERVIEW_QUESTIONS,
} from "@/lib/robotics/robotInterview";
import {
  genericPrismaticRobot,
  genericSixDofRobot,
  genericTwoDofRobot,
  meca500R4Robot,
} from "@/lib/robotics/robots";
import type { RobotSpec } from "@/lib/robotics/kinematics";

const CATALOG: readonly RobotSpec[] = [
  genericTwoDofRobot,
  genericPrismaticRobot,
  genericSixDofRobot,
  meca500R4Robot,
];

interface Exchange {
  id: string;
  soru: string;
  cevap: string;
}

/**
 * "Robot Röportajı" — ders/puan/hesap yok, `/oyun-alani` ile aynı serbest
 * deney ailesi. Cevaplar `lib/robotics/robotInterview.ts`teki saf motordan
 * gelir; bu bileşen yalnız soru seçimini ve konuşma geçmişini yönetir.
 */
export function RobotInterview() {
  const [robotId, setRobotId] = useState(CATALOG[0].id);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const robot = CATALOG.find((candidate) => candidate.id === robotId) ?? CATALOG[0];

  function ask(questionId: (typeof ROBOT_INTERVIEW_QUESTIONS)[number]["id"], soru: string) {
    const cevap = answerRobotInterviewQuestion(robot, questionId);
    setExchanges((current) => [...current, { id: `${questionId}-${current.length}`, soru, cevap }]);
  }

  function robotDegistir(nextId: string) {
    setRobotId(nextId);
    setExchanges([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="roportaj-robot" className="text-sm font-semibold text-site-ink">
          Röportaj yapacağın robot
        </label>
        <select
          id="roportaj-robot"
          value={robotId}
          onChange={(event) => robotDegistir(event.target.value)}
          className="min-h-11 max-w-md rounded-lg border border-site-border bg-site-surface px-3 text-site-ink"
        >
          {CATALOG.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.displayName}
            </option>
          ))}
        </select>
      </div>

      <details className="rounded-xl border border-site-border bg-site-surface p-3">
        <summary className="min-h-11 cursor-pointer py-1 text-sm font-semibold text-site-ink">Bir mühendis bu soruları neden sorar?</summary>
        <dl className="mt-3 grid gap-2 text-sm text-site-muted sm:grid-cols-2">
          {ROBOT_INTERVIEW_QUESTIONS.map((question) => (
            <div key={question.id} className="rounded-lg bg-site-soft p-2.5">
              <dt className="font-semibold text-site-ink">{question.soru}</dt>
              <dd className="mt-0.5 leading-5">{question.neden}</dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Sorulacak sorular">
        {ROBOT_INTERVIEW_QUESTIONS.map((question) => (
          <button
            key={question.id}
            type="button"
            title={question.neden}
            onClick={() => ask(question.id, question.soru)}
            className="min-h-11 rounded-full border border-site-border bg-site-surface px-4 text-sm font-semibold text-site-ink hover:bg-site-soft"
          >
            {question.soru}
          </button>
        ))}
        {exchanges.length > 0 && (
          <button
            type="button"
            onClick={() => setExchanges([])}
            className="min-h-11 rounded-full border border-dashed border-site-border px-4 text-sm text-site-muted"
          >
            Röportajı sıfırla
          </button>
        )}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label="Röportaj geçmişi"
        className="flex min-h-24 flex-col gap-4 rounded-xl border border-site-border bg-site-soft p-4"
      >
        {exchanges.length === 0 ? (
          <p className="text-sm text-site-muted">
            Yukarıdan bir soru seç — {robot.displayName} sana kendi gerçek verileriyle cevap versin.
          </p>
        ) : (
          exchanges.map((exchange) => (
            <div key={exchange.id} className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-site-accent-text">Sen: {exchange.soru}</p>
              <p className="text-sm text-site-ink" data-testid="roportaj-cevap">
                {robot.displayName}: {exchange.cevap}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
