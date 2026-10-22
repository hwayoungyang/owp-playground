export const defaultTextPattern = '^[A-Za-z0-9]*$';

type TextPattern =
  | { readonly valid: true; readonly pattern: RegExp | null }
  | { readonly valid: false };

export function compileTextPattern(source: string): TextPattern {
  try {
    return { valid: true, pattern: source === '' ? null : new RegExp(source) };
  } catch (error) {
    if (error instanceof SyntaxError) return { valid: false };
    throw error;
  }
}

export function matchesTextPattern(pattern: RegExp | null, value: string): boolean {
  if (value === '' || pattern === null) return true;
  const fullPattern = new RegExp(
    `^(?:${pattern.source})(?![\\s\\S])`,
    pattern.flags.replace(/[gy]/g, ''),
  );
  const match = fullPattern.exec(value);
  return match !== null && match.index === 0 && match[0].length === value.length;
}
