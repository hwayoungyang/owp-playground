import { isLiteralToken, type SourceToken } from './highlight-tokens';

export type ApiSymbolContext = {
  readonly package?: string;
  readonly api?: readonly string[];
};

type ImportedSymbol = {
  readonly local: string;
  readonly end: number;
  readonly namespacePath?: string;
};
type TokenRange = { readonly start: number; readonly end: number };

function isPublicApi(path: string, name: string, context?: ApiSymbolContext) {
  const owner = path.match(/^(@owp\/[^/]+)(?:\/|$)/)?.[1];
  if (!owner || /\/(types|internal)(?:\/|$)/.test(path) || /^[A-Z][A-Z\d_]*$/.test(name))
    return false;
  const explicit =
    context?.api?.includes(`${owner}:${name}`) ||
    (owner === context?.package && context?.api?.includes(name));
  if (explicit) return true;
  if (name === 'useOwpTranslation') return false;
  return !context?.package || owner === context.package;
}

function imports(tokens: readonly SourceToken[], context?: ApiSymbolContext) {
  const symbols: ImportedSymbol[] = [];
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index]?.text !== 'import' || tokens[index + 1]?.text === 'type') continue;
    let from = index + 1;
    while (from < tokens.length && !['from', ';'].includes(tokens[from]?.text ?? '')) from++;
    const path = tokens[from + 1];
    if (tokens[from]?.text !== 'from' || !path?.scopes.includes('hljs-string')) continue;
    const named = tokens.slice(index + 1, from);
    const open = named.findIndex((token) => token.text === '{');
    if (open < 0) {
      const namespace = named[0]?.text === '*' && named[1]?.text === 'as' ? named[2] : undefined;
      if (namespace)
        symbols.push({
          local: namespace.text,
          end: path.end,
          namespacePath: path.text.slice(1, -1),
        });
      continue;
    }
    for (const entry of splitImports(named.slice(open + 1))) {
      const original = entry[0];
      const local = entry[1]?.text === 'as' ? entry[2] : original;
      if (
        original &&
        local &&
        original.text !== 'type' &&
        isPublicApi(path.text.slice(1, -1), original.text, context)
      )
        symbols.push({ local: local.text, end: path.end });
    }
    index = from + 1;
  }
  return symbols;
}

function splitImports(tokens: readonly SourceToken[]) {
  const entries: SourceToken[][] = [[]];
  for (const token of tokens) {
    if (token.text === ',') entries.push([]);
    else if (token.text !== '}') entries.at(-1)?.push(token);
  }
  return entries;
}

function delimiters(tokens: readonly SourceToken[]) {
  const pairs = new Map<number, number>();
  const stack: number[] = [];
  for (const [index, token] of tokens.entries()) {
    if (isLiteralToken(token) || token.scopes.some((scope) => /hljs-(tag|name)/.test(scope)))
      continue;
    if (['(', '{', '['].includes(token.text)) stack.push(index);
    else if ([')', '}', ']'].includes(token.text)) {
      const open = stack.pop();
      if (open !== undefined) {
        pairs.set(open, index);
        pairs.set(index, open);
      }
    }
  }
  return pairs;
}

function bodyRange(
  tokens: readonly SourceToken[],
  pairs: ReadonlyMap<number, number>,
  start: number,
): TokenRange {
  const end = pairs.get(start);
  if (tokens[start]?.text === '{' && end !== undefined) return { start, end };
  let cursor = start;
  while (cursor < tokens.length && ![';', ','].includes(tokens[cursor]?.text ?? '')) {
    const close = pairs.get(cursor);
    cursor = close !== undefined && close > cursor ? close + 1 : cursor + 1;
  }
  return { start, end: cursor };
}

function shadowRanges(tokens: readonly SourceToken[], name: string, importEnd: number) {
  const pairs = delimiters(tokens);
  const ranges: TokenRange[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.end <= importEnd || token.text !== name) continue;
    const previous = tokens[index - 1]?.text;
    let binding = index - 1;
    while (
      binding > 0 &&
      !['const', 'let', 'var', '=', ';', '(', '=>'].includes(tokens[binding]?.text ?? '')
    )
      binding--;
    const declaration = ['const', 'let', 'var'].includes(tokens[binding]?.text ?? '');
    if (declaration || (previous && ['function', 'class'].includes(previous))) {
      let open = index - 1;
      while (open >= 0 && !(tokens[open]?.text === '{' && (pairs.get(open) ?? 0) > index)) open--;
      if (
        tokens[open - 1]?.text === 'const' ||
        tokens[open - 1]?.text === 'let' ||
        tokens[open - 1]?.text === 'var'
      ) {
        open--;
        while (open >= 0 && !(tokens[open]?.text === '{' && (pairs.get(open) ?? 0) > index)) open--;
      }
      ranges.push({ start: Math.max(open, 0), end: pairs.get(open) ?? tokens.length });
    }
  }
  for (const [index, token] of tokens.entries()) {
    if (token.text !== '=>') continue;
    const close = index - 1;
    const open = tokens[close]?.text === ')' ? pairs.get(close) : close;
    if (
      open === undefined ||
      !tokens.slice(open, index).some((parameter) => parameter.text === name)
    )
      continue;
    const body = bodyRange(tokens, pairs, index + 1);
    ranges.push({ start: open, end: body.end });
  }
  for (const [index, token] of tokens.entries()) {
    if (!['function', 'catch'].includes(token.text)) continue;
    let open = index + 1;
    while (open < tokens.length && !['(', '{', ';'].includes(tokens[open]?.text ?? '')) open++;
    const close = pairs.get(open);
    if (tokens[open]?.text !== '(' || close === undefined) continue;
    if (tokens.slice(open + 1, close).some((parameter) => parameter.text === name)) {
      const body = bodyRange(tokens, pairs, close + 1);
      ranges.push({ start: open, end: body.end });
    }
  }
  return ranges;
}

/** 현재 패키지와 명시적으로 연결한 지원 API의 runtime 사용 이름만 선택합니다. */
export function apiSymbolPositions(
  tokens: readonly SourceToken[],
  context?: ApiSymbolContext,
): ReadonlySet<number> {
  const positions = new Set<number>();
  const pairs = delimiters(tokens);
  for (const symbol of imports(tokens, context)) {
    const shadows = shadowRanges(tokens, symbol.local, symbol.end);
    for (const [index, token] of tokens.entries()) {
      const member =
        symbol.namespacePath !== undefined &&
        tokens[index - 2]?.text === symbol.local &&
        tokens[index - 1]?.text === '.';
      if (
        token.start < symbol.end ||
        (symbol.namespacePath ? !member : token.text !== symbol.local)
      )
        continue;
      if (symbol.namespacePath && !isPublicApi(symbol.namespacePath, token.text, context)) continue;
      if (isLiteralToken(token) || token.scopes.some((scope) => /hljs-(attr|property)/.test(scope)))
        continue;
      if (shadows.some((range) => index >= range.start && index <= range.end)) continue;
      const previous = tokens[index - 1]?.text;
      const next = tokens[index + 1]?.text;
      const callEnd = next === '(' ? pairs.get(index + 1) : undefined;
      const declaration = callEnd !== undefined && tokens[callEnd + 1]?.text === '{';
      if (
        (!member && (previous === '.' || previous === '?.')) ||
        next === ':' ||
        next === '=' ||
        declaration
      )
        continue;
      const jsx = token.scopes.includes('hljs-name');
      const reference =
        previous !== undefined && ['=', '(', ',', ':', 'return', '=>', '{', '['].includes(previous);
      if (jsx || next === '(' || next === '<' || reference) positions.add(token.start);
    }
  }
  return positions;
}
