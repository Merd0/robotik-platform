"use client";

import dynamic from "next/dynamic";
import type { PythonCodeEditorProps } from "./PythonCodeEditor";

const PythonCodeEditor = dynamic(
  () => import("./PythonCodeEditor").then((module) => module.PythonCodeEditor),
  {
    ssr: false,
    loading: () => (
      <div
        aria-busy="true"
        role="status"
        className="flex min-h-60 items-center rounded-lg border border-site-border bg-site-bg p-3 font-mono text-sm text-site-muted"
      >
        Kod editörü hazırlanıyor…
      </div>
    ),
  },
);

export function LazyPythonCodeEditor(props: PythonCodeEditorProps) {
  return <PythonCodeEditor {...props} />;
}
