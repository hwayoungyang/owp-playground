import type { PublicApiKind } from './types';
import { normalizeAppTerminology } from '../../shared/i18n/reference-copy';

type TranslateDescription = (key: string, values?: Readonly<Record<string, string>>) => string;

const formats = {
  component: ['{{name}} 컴포넌트', '{{name}} component', /(?:컴포넌트|\bcomponent)$/iu],
  hook: ['{{name}} Hook', '{{name}} Hook', /\bhook$/iu],
  function: ['{{name}} 유틸', '{{name}} utility', /(?:유틸(?:리티)?|\butility)$/iu],
  class: ['{{name}} 클래스', '{{name}} class', /(?:클래스|\bclass)$/iu],
  context: ['{{name}} Context', '{{name}} Context', /\bcontext$/iu],
  value: ['{{name}} 값', '{{name}} value', /(?:값|상수|\bvalue|\bconstant)$/iu],
  type: ['{{name}} 타입', '{{name}} type', /(?:타입|\btype)$/iu],
  asset: ['{{name}} 파일', '{{name}} file', /(?:파일|\bfile)$/iu],
} as const satisfies Record<PublicApiKind, readonly [string, string, RegExp]>;

export const apiKindDescriptionEnglish: Readonly<Record<string, string>> = Object.fromEntries(
  Object.values(formats).map(([korean, english]) => [korean, english]),
);

export function describeApiKind(
  description: string,
  kind: PublicApiKind,
  translate: TranslateDescription,
): string {
  const [template, , ending] = formats[kind];
  const normalized = normalizeAppTerminology(description);
  if (ending.test(normalized)) return normalized;
  const role = kind === 'type' ? normalized.replace(/\s+(?:종류|유형)$/u, '') : normalized;
  return translate(template, { name: role });
}

export function apiDescriptionSearchText(
  descriptions: readonly string[],
  kind: PublicApiKind,
): readonly string[] {
  return descriptions.map((description, index) =>
    describeApiKind(description, kind, (key, values) =>
      (index === 0 ? key : (apiKindDescriptionEnglish[key] ?? key)).replace(
        '{{name}}',
        values?.name ?? '',
      ),
    ),
  );
}
