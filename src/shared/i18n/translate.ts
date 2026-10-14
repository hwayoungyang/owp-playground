import i18next, { type TOptions } from 'i18next';

export function translate(value: string, options?: TOptions): string {
  return i18next.t(value, { ...options, ns: 'app', defaultValue: value });
}
