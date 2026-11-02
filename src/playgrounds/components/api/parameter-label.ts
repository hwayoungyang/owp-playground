import type { ComponentsApiParameter } from './types';

export function parameterLabel(
  parameter: Pick<ComponentsApiParameter, 'name' | 'type'>,
  translate: (key: string) => string,
): string {
  if (parameter.name.trim().startsWith('[')) return translate('배열 인자');
  if (parameter.name.trim().startsWith('{') || /^__\d+$/.test(parameter.name))
    return translate(/Options(?:<|\s|$)/.test(parameter.type) ? '옵션' : '입력 객체');
  return parameter.name;
}
