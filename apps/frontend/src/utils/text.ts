type QuillAttributes = Record<string, unknown>;

type QuillOp = {
  insert?: unknown;
  attributes?: QuillAttributes;
};

type QuillDelta = {
  ops: QuillOp[];
};

type QuillDeltaInput = string | QuillDelta | Record<string, unknown> | null | undefined;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toQuillDelta(value: QuillDeltaInput): QuillDelta | null {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return toQuillDelta(JSON.parse(trimmed));
    } catch {
      return null;
    }
  }

  if (!isPlainObject(value)) return null;
  const ops = value.ops;
  if (!Array.isArray(ops)) return null;

  const normalizedOps: QuillOp[] = [];
  for (const rawOp of ops) {
    if (!isPlainObject(rawOp)) continue;
    const op: QuillOp = {};
    if ("insert" in rawOp) {
      op.insert = (rawOp as QuillOp).insert;
    }
    if (isPlainObject(rawOp.attributes)) {
      const attrs: QuillAttributes = { ...rawOp.attributes };
      // enforce LTR flow; remove explicit RTL flags
      if ("direction" in attrs) {
        const direction = attrs.direction;
        if (direction !== "ltr") {
          delete attrs.direction;
        }
      }
      if (Object.keys(attrs).length > 0) {
        op.attributes = attrs;
      }
    }
    normalizedOps.push(op);
  }

  return { ops: normalizedOps };
}

function stringifyQuillDelta(value: QuillDeltaInput): string | undefined {
  const parsed = toQuillDelta(value);
  if (!parsed) return undefined;
  try {
    return JSON.stringify(parsed);
  } catch {
    return undefined;
  }
}

function sanitizePlainText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function quillDeltaToPlainText(delta?: QuillDeltaInput): string {
  const parsed = toQuillDelta(delta);
  if (!parsed) return "";

  const result = parsed.ops
    .map((op) => (typeof op.insert === "string" ? op.insert : ""))
    .join("");
  return sanitizePlainText(result);
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
  delta?: QuillDeltaInput;
}): string {
  const fromDelta = quillDeltaToPlainText(opts.delta);
  if (fromDelta.length) return fromDelta;
  return htmlToPlainText(opts.html);
}

export function ensureQuillDeltaString(delta?: QuillDeltaInput): string | undefined {
  if (!delta) return undefined;
  if (typeof delta === "string") {
    const trimmed = delta.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return stringifyQuillDelta(delta);
}
