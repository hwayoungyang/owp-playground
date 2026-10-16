import type { z } from 'zod';
import { opacityRange } from './schemas';

export type ThemeFieldCommitResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: z.ZodError };

export type ThemeFieldMessage = {
  readonly key: string;
  readonly options?: Readonly<Record<string, string | number>>;
};

export function themeFieldMessage(error: z.ZodError): ThemeFieldMessage {
  const issue = error.issues[0];
  const field = String(issue?.path.at(-1) ?? '');
  if (field.endsWith('Opacity')) {
    return { key: '{{min}}~{{max}} 사이의 숫자를 입력해 주세요.', options: opacityRange };
  }
  if (field === 'easing') {
    return {
      key: 'linear, ease, ease-in, ease-out, ease-in-out 또는 cubic-bezier(...)를 입력해 주세요.',
    };
  }
  if (field === 'fontWeight') {
    return { key: '100~900 사이의 숫자 또는 normal, bold를 입력해 주세요.' };
  }
  if (field === 'main') {
    return { key: 'HEX, rgb(), rgba(), hsl() 또는 hsla() 형식으로 입력해 주세요.' };
  }
  if (
    /color$/i.test(field) ||
    ['main', 'contrastText', 'primary', 'secondary', 'default', 'paper', 'divider'].includes(field)
  ) {
    return {
      key:
        issue?.path[0] === 'overlay' && ['loadingProgressColor', 'errorColor'].includes(field)
          ? 'HEX, rgb(), rgba(), hsl(), hsla(), transparent, currentColor 또는 primary.main 같은 팔레트 값을 입력해 주세요.'
          : 'HEX, rgb(), rgba(), hsl(), hsla(), transparent 또는 currentColor 형식으로 입력해 주세요.',
    };
  }
  switch (issue?.code) {
    case 'too_small':
      return {
        key: '{{min}} 이상의 숫자를 입력해 주세요.',
        options: { min: String(issue.minimum) },
      };
    case 'too_big':
      return {
        key: '{{max}} 이하의 숫자를 입력해 주세요.',
        options: { max: String(issue.maximum) },
      };
    case 'invalid_type':
      if (issue.expected === 'number') return { key: '숫자를 입력해 주세요.' };
      break;
    case 'invalid_union':
      return { key: '0~500 사이의 숫자 또는 px, rem, em, % 단위를 붙인 값을 입력해 주세요.' };
  }
  return { key: '입력 형식과 값을 확인해 주세요.' };
}
