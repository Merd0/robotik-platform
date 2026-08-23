"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, type CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  type DecorationSet,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import {
  ROBOT_API_COMPLETIONS,
  findPythonErrorLine,
  robotCompletionPrefix,
} from "@/lib/pythonCodeEditor";

export type PythonEditorTone = "site" | "ortaokul" | "lise" | "universite";

export interface PythonCodeEditorProps {
  id: string;
  labelledBy: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  tone?: PythonEditorTone;
}

const setErrorLine = StateEffect.define<number | null>();
const errorLineDecoration = (line: number) =>
  Decoration.line({
    attributes: {
      class: "cm-python-errorLine",
      "data-error-line": String(line),
    },
  });

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let next = transaction.docChanged ? Decoration.none : decorations;
    for (const effect of transaction.effects) {
      if (!effect.is(setErrorLine)) continue;
      const lineNumber = effect.value;
      if (lineNumber === null || lineNumber > transaction.state.doc.lines) {
        next = Decoration.none;
      } else {
        const line = transaction.state.doc.line(lineNumber);
        next = Decoration.set([errorLineDecoration(lineNumber).range(line.from)]);
      }
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

const pythonHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword], class: "cm-python-tokenKeyword" },
  { tag: [tags.string, tags.docString, tags.character], class: "cm-python-tokenString" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], class: "cm-python-tokenLiteral" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], class: "cm-python-tokenComment" },
  { tag: [tags.propertyName, tags.function(tags.variableName)], class: "cm-python-tokenFunction" },
  { tag: [tags.operator, tags.punctuation], class: "cm-python-tokenOperator" },
]);

function robotCompletionSource(context: CompletionContext) {
  const documentText = context.state.doc.toString();
  const match = robotCompletionPrefix(documentText, context.pos);
  if (!match) return null;

  return {
    from: match.from,
    options: ROBOT_API_COMPLETIONS.map((completion) => ({
      label: completion.label,
      apply: completion.apply,
      detail: completion.detail,
      info: completion.info,
      type: "method",
    })),
    validFor: /^[A-Za-z_]*$/,
  };
}

const editorTheme = EditorView.theme({
  "&": {
    color: "var(--code-editor-ink)",
    backgroundColor: "var(--code-editor-bg)",
    border: "1px solid var(--code-editor-border)",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
  },
  "&.cm-focused": {
    outline: "2px solid var(--code-editor-accent)",
    outlineOffset: "2px",
  },
  ".cm-scroller": {
    maxHeight: "24rem",
    overflow: "auto",
    fontFamily: "var(--font-mono)",
    lineHeight: "1.55",
  },
  ".cm-content, .cm-gutter": {
    minHeight: "15rem",
  },
  ".cm-content": {
    padding: "0.75rem 0",
    caretColor: "var(--code-editor-accent)",
  },
  ".cm-line": {
    padding: "0 0.75rem",
  },
  ".cm-gutters": {
    color: "color-mix(in srgb, var(--code-editor-ink) 72%, transparent)",
    backgroundColor: "color-mix(in srgb, var(--code-editor-bg) 88%, var(--code-editor-ink))",
    borderRight: "1px solid var(--code-editor-border)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "2.5rem",
    padding: "0 0.65rem 0 0.5rem",
  },
  ".cm-activeLine, .cm-activeLineGutter": {
    backgroundColor: "color-mix(in srgb, var(--code-editor-accent) 10%, transparent)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in srgb, var(--code-editor-accent) 25%, transparent)",
  },
  ".cm-python-errorLine": {
    backgroundColor: "color-mix(in srgb, #dc2626 14%, transparent)",
    boxShadow: "inset 3px 0 #dc2626",
  },
  ".cm-python-tokenKeyword": {
    color: "var(--code-editor-accent)",
    fontWeight: "700",
  },
  ".cm-python-tokenString": {
    color: "color-mix(in srgb, var(--code-editor-accent) 76%, var(--code-editor-ink))",
  },
  ".cm-python-tokenLiteral": {
    color: "color-mix(in srgb, var(--code-editor-accent) 62%, var(--code-editor-ink))",
    fontWeight: "600",
  },
  ".cm-python-tokenComment": {
    color: "color-mix(in srgb, var(--code-editor-ink) 68%, transparent)",
    fontStyle: "italic",
  },
  ".cm-python-tokenFunction": {
    color: "color-mix(in srgb, var(--code-editor-accent) 70%, var(--code-editor-ink))",
  },
  ".cm-python-tokenOperator": {
    color: "color-mix(in srgb, var(--code-editor-ink) 78%, transparent)",
  },
  ".cm-tooltip": {
    color: "var(--code-editor-ink)",
    backgroundColor: "var(--code-editor-surface)",
    border: "1px solid var(--code-editor-border)",
    borderRadius: "0.5rem",
    overflow: "hidden",
  },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
    color: "var(--code-editor-ink)",
    backgroundColor: "color-mix(in srgb, var(--code-editor-accent) 18%, var(--code-editor-surface))",
  },
});

const TONE_VARIABLES: Record<PythonEditorTone, CSSProperties> = {
  site: {
    "--code-editor-bg": "var(--color-site-bg)",
    "--code-editor-surface": "var(--color-site-surface)",
    "--code-editor-border": "var(--color-site-border)",
    "--code-editor-ink": "var(--color-site-ink)",
    "--code-editor-accent": "var(--color-site-accent-text)",
  } as CSSProperties,
  ortaokul: {
    "--code-editor-bg": "var(--color-ortaokul-bg)",
    "--code-editor-surface": "var(--color-ortaokul-surface)",
    "--code-editor-border": "color-mix(in srgb, var(--color-ortaokul-ink) 20%, transparent)",
    "--code-editor-ink": "var(--color-ortaokul-ink)",
    "--code-editor-accent": "var(--color-ortaokul-accent-text)",
  } as CSSProperties,
  lise: {
    "--code-editor-bg": "var(--color-lise-bg)",
    "--code-editor-surface": "var(--color-lise-surface)",
    "--code-editor-border": "color-mix(in srgb, var(--color-lise-ink) 20%, transparent)",
    "--code-editor-ink": "var(--color-lise-ink)",
    "--code-editor-accent": "var(--color-lise-accent-text)",
  } as CSSProperties,
  universite: {
    "--code-editor-bg": "var(--color-universite-bg)",
    "--code-editor-surface": "var(--color-universite-surface)",
    "--code-editor-border": "color-mix(in srgb, var(--color-universite-ink) 20%, transparent)",
    "--code-editor-ink": "var(--color-universite-ink)",
    "--code-editor-accent": "var(--color-universite-accent-text)",
  } as CSSProperties,
};

export function PythonCodeEditor({
  id,
  labelledBy,
  value,
  onChange,
  error = null,
  tone = "site",
}: PythonCodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const syncingExternalValueRef = useRef(false);
  const initialConfigRef = useRef({ id, labelledBy, value });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const initial = initialConfigRef.current;
    const state = EditorState.create({
      doc: initial.value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        EditorView.lineWrapping,
        EditorState.tabSize.of(4),
        python(),
        syntaxHighlighting(pythonHighlightStyle),
        autocompletion({ override: [robotCompletionSource], activateOnTyping: true }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        errorLineField,
        editorTheme,
        EditorView.contentAttributes.of({
          id: initial.id,
          role: "textbox",
          "aria-labelledby": initial.labelledBy,
          "aria-multiline": "true",
          spellcheck: "false",
          autocapitalize: "off",
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !syncingExternalValueRef.current) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: host });
    const focusEditorFromScroller = () => view.focus();
    view.scrollDOM.tabIndex = 0;
    view.scrollDOM.setAttribute("aria-label", "Kod editörü kaydırma alanı");
    view.scrollDOM.addEventListener("focus", focusEditorFromScroller);
    viewRef.current = view;
    return () => {
      view.scrollDOM.removeEventListener("focus", focusEditorFromScroller);
      viewRef.current = null;
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    syncingExternalValueRef.current = true;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    syncingExternalValueRef.current = false;
  }, [value]);

  const lineCount = value.split(/\r\n?|\n/).length;
  const errorLine = findPythonErrorLine(error, lineCount);
  useEffect(() => {
    viewRef.current?.dispatch({ effects: setErrorLine.of(errorLine) });
  }, [errorLine]);

  return <div ref={hostRef} style={TONE_VARIABLES[tone]} data-testid="python-code-editor" />;
}
