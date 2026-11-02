import { useCallback, useEffect, useState } from 'react';
import { JsonResult } from '../../../../features/code/JsonResult';
import type { ComponentsExampleProps } from '../../model/types';

type ExampleData = Readonly<Record<string, unknown>>;
export type SectionObserver = {
  readonly id: string;
  readonly report: (id: string, data: ExampleData) => void;
  readonly onRecord: ComponentsExampleProps['onRecord'];
};

export function useExampleData(onData: ComponentsExampleProps['onData']) {
  const [sections, setSections] = useState<Readonly<Record<string, ExampleData>>>({});
  const report = useCallback((id: string, data: ExampleData) => {
    setSections((previous) => ({ ...previous, [id]: data }));
  }, []);
  useEffect(() => {
    onData(sections);
  }, [onData, sections]);
  return report;
}

export function ExampleResult({ value }: { readonly value: unknown }) {
  return <JsonResult value={value} />;
}
