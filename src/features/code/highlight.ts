import type { LanguageFn, Mode } from 'highlight.js';
import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { apiSymbolPositions, type ApiSymbolContext } from './api-symbols';
import { emphasizeTokens, sourceTokens } from './highlight-tokens';

const tsx: LanguageFn = (api) => {
  const grammar = typescript(api);
  const jsxMode = grammar.contains
    .flatMap((mode) => (typeof mode === 'object' ? (mode.contains ?? []) : []))
    .find(
      (mode): mode is Mode =>
        typeof mode === 'object' && mode.subLanguage === 'xml' && !!mode.variants,
    );
  const openingTagCheck = jsxMode?.variants?.find((mode) => mode['on:begin'])?.['on:begin'];
  const expression: Mode = {
    begin: /\{/,
    end: /\}/,
    keywords: grammar.keywords,
    contains: [],
  };
  const tags: Mode[] = [
    {
      begin: [/</, /[A-Za-z][\w.:-]*(?=\s|\/?>)/],
      beginScope: { 1: 'tag', 2: 'name' },
      end: /\/?>/,
      endScope: 'tag',
      // TypeScript 원본의 generic·JSX 구분 규칙을 유지합니다.
      'on:begin': openingTagCheck,
      contains: [
        { scope: 'attr', begin: /[\w:-]+/ },
        expression,
        api.QUOTE_STRING_MODE,
        api.APOS_STRING_MODE,
      ],
    },
    {
      begin: [/<\//, /[A-Za-z][\w.:-]*/],
      beginScope: { 1: 'tag', 2: 'name' },
      end: />/,
      endScope: 'tag',
    },
    { scope: 'tag', match: /<\/?>/ },
  ];
  // JSX 블록을 XML 하위 언어로 나누면 중첩 prop의 expression 경계가 끊어집니다.
  for (const mode of grammar.contains) {
    if (jsxMode && typeof mode === 'object' && mode.contains?.includes(jsxMode))
      mode.contains = mode.contains.flatMap((child) => (child === jsxMode ? tags : [child]));
  }
  grammar.contains.unshift(...tags);
  expression.contains = ['self', ...grammar.contains];
  return grammar;
};
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('typescript', tsx);
hljs.registerLanguage('json', json);
hljs.registerLanguage('jsonc', (api) => ({
  ...json(api),
  contains: [...json(api).contains, api.C_LINE_COMMENT_MODE, api.C_BLOCK_COMMENT_MODE],
}));
hljs.registerLanguage('css', css);

export function highlightSource(
  content: string,
  language: 'typescript' | 'json' | 'jsonc' | 'css',
  context?: ApiSymbolContext,
) {
  const html = hljs.highlight(content, { language }).value;
  return language === 'typescript' && context
    ? emphasizeTokens(html, apiSymbolPositions(sourceTokens(html), context))
    : html;
}
