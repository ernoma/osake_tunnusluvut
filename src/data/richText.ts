// Tekstikenttien [[termi]]- ja [[termi|näytettävä muoto]]-merkintöjen käsittely.

export type RichSegment =
  { kind: "text"; text: string } | { kind: "term"; key: string; label: string };

const TERM_PATTERN = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;

/** Vertailuavain termille: kirjainkoko ja reunavälit eivät merkitse. */
export function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase("fi");
}

export function parseRichText(text: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(TERM_PATTERN)) {
    const [whole, key = "", label] = match;
    if (match.index > last) segments.push({ kind: "text", text: text.slice(last, match.index) });
    segments.push({ kind: "term", key: key.trim(), label: (label ?? key).trim() });
    last = match.index + whole.length;
  }
  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}

/** Teksti sellaisena kuin käyttäjä sen näkee, ilman merkintöjä. */
export function toPlainText(text: string): string {
  return parseRichText(text)
    .map((s) => (s.kind === "text" ? s.text : s.label))
    .join("");
}

/** Termiavaimet tekstistä (normalisoituna). */
export function termKeys(text: string): string[] {
  return parseRichText(text).flatMap((s) => (s.kind === "term" ? [normalizeKey(s.key)] : []));
}

/** True, jos tekstissä on rikkinäinen merkintä, esim. "[[termi" tai "termi]]". */
export function hasMalformedMarkup(text: string): boolean {
  const withoutValid = text.replace(TERM_PATTERN, "");
  return withoutValid.includes("[[") || withoutValid.includes("]]");
}
