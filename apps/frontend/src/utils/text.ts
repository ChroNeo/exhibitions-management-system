type QuillOp = {
  insert?: unknown;
};

type QuillDelta = {
  ops?: QuillOp[];
};

function sanitizePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function quillDeltaToPlainText(
  deltaString?: string | null
): string {
  if (!deltaString) return "";
  try {
    const parsed = JSON.parse(deltaString) as QuillDelta;
    if (!parsed || !Array.isArray(parsed.ops)) return "";
    const result = parsed.ops
      .map((op) => (typeof op.insert === "string" ? op.insert : ""))
      .join("");
    return sanitizePlainText(result);
  } catch {
    return "";
  }
}

export function htmlToPlainText(html?: string | null): string {
  if (!html) return "";
  const replaced = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  const normalized = replaced.replace(/\n{2,}/g, "\n");
  return sanitizePlainText(normalized);
}

export function extractPlainTextDescription(opts: {
  html?: string | null;
  delta?: string | null;
}): string {
  const fromDelta = quillDeltaToPlainText(opts.delta);
  if (fromDelta.length) return fromDelta;
  return htmlToPlainText(opts.html);
}
