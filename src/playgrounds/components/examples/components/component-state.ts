import { useEffect, useState } from 'react';
import type { ComponentsExampleProps } from '../../model/types';

export function useComponentExampleState<T extends Readonly<Record<string, unknown>>>(
  initial: T,
  { onData, onRecord }: ComponentsExampleProps,
) {
  const [values, setValues] = useState(initial);
  useEffect(() => onData(values), [onData, values]);
  function change<K extends keyof T>(section: K, value: T[K]) {
    setValues((previous) => ({ ...previous, [section]: value }));
    onRecord(String(section), JSON.stringify(value));
  }
  return [values, change] as const;
}
