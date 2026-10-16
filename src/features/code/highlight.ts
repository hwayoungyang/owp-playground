import type { LanguageFn, Mode } from 'highlight.js';
import hljs from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

const jsxXml: LanguageFn = (api) => {
  const grammar = xml(api);
  const expression: Mode = {
    begin: /\{/,
    end: /\}/,
    subLanguage: 'typescript',
    contains: ['self'],
  };
  grammar.contains.unshift(
    {
      scope: 'tag',
      begin: /<(?=[A-Za-z][\w.:-]*(?:\s|\/?>))/,
      end: /\/?>/,
      contains: [
        {
          scope: 'name',
          begin: /[A-Za-z][\w.:-]*/,
          starts: {
            endsWithParent: true,
            contains: [
              { scope: 'attr', begin: /[\w:-]+(?=\s*=)/ },
              expression,
              api.QUOTE_STRING_MODE,
              api.APOS_STRING_MODE,
            ],
          },
        },
      ],
    },
    expression,
  );
  return grammar;
};
hljs.registerLanguage('xml', jsxXml);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('jsonc', (api) => ({
  ...json(api),
  contains: [...json(api).contains, api.C_LINE_COMMENT_MODE, api.C_BLOCK_COMMENT_MODE],
}));
hljs.registerLanguage('css', css);

export function highlightSource(
  content: string,
  language: 'typescript' | 'json' | 'jsonc' | 'css',
) {
  return hljs.highlight(content, { language }).value;
}
