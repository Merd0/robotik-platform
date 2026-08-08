import { createHash } from "node:crypto";
import type { DersFrontmatter, Lesson } from "./content";

type CanonicalValue = null | boolean | number | string | CanonicalValue[] | { [key: string]: CanonicalValue };

function canonicalize(value: unknown): CanonicalValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  throw new TypeError(`Ders artifact'ında kanonikleştirilemeyen değer: ${typeof value}`);
}

export function createLessonArtifactPayload(
  lesson: Pick<Lesson, "frontmatter" | "body">,
): string {
  const {
    incelendi_tarafindan: _legacyReviewer,
    incelendi_tarih: _legacyReviewDate,
    ...contentFrontmatter
  } = lesson.frontmatter;
  const normalizedBody = lesson.body.replace(/\r\n?/g, "\n").trimEnd() + "\n";

  return JSON.stringify(
    canonicalize({
      schema: "lesson-artifact/v1",
      frontmatter: contentFrontmatter as DersFrontmatter,
      body: normalizedBody,
    }),
  );
}

export function computeLessonArtifactHash(lesson: Pick<Lesson, "frontmatter" | "body">): string {
  const digest = createHash("sha256").update(createLessonArtifactPayload(lesson), "utf8").digest("hex");
  return `sha256:${digest}`;
}
