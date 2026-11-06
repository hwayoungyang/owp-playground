import { useEffect } from 'react';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { mergeSelectorOptions } from '@owp/components/utils';
import type { OwpSelectorBaseOption } from '@owp/components/types';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

const first = [
  { value: 'A', label: 'Alpha' },
  { value: 'B', label: 'Beta' },
];
const second = [
  { value: 'A', label: 'Alpha replacement' },
  { value: 'C', label: 'Gamma' },
];
function OptionTable({ options }: { readonly options: readonly OwpSelectorBaseOption[] }) {
  const { t } = useOwpTranslation();
  return (
    <OwpTable
      sx={{ '& th, & td': { textAlign: 'left' } }}
      size="small"
      aria-label={t('병합한 옵션')}
      headers={{ value: 'value', label: 'label' }}
      rows={options.map((option) => ({ value: option.value, label: option.label }))}
    />
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  useEffect(() => {
    onData({
      firstWins: mergeSelectorOptions(first, second),
      secondWins: mergeSelectorOptions(second, first),
      missing: mergeSelectorOptions(undefined, first, []),
    });
  }, [onData]);
  return (
    <>
      <ExampleSection
        title="먼저 전달한 A 유지"
        description="첫 그룹의 Alpha가 남고 두 번째 그룹의 새 항목 C가 뒤에 추가됩니다."
      >
        <OptionTable options={mergeSelectorOptions(first, second)} />
      </ExampleSection>
      <ExampleSection
        title="그룹 순서를 바꾼 결과"
        description="두 번째 그룹을 먼저 전달하면 A의 label은 Alpha replacement가 됩니다."
      >
        <OptionTable options={mergeSelectorOptions(second, first)} />
      </ExampleSection>
      <ExampleSection
        title="undefined와 빈 그룹"
        description="undefined와 빈 배열은 항목을 추가하지 않습니다. 인수가 없으면 빈 배열입니다."
      >
        <ExampleResult
          value={{
            withMissing: mergeSelectorOptions(undefined, first, []),
            noArguments: mergeSelectorOptions(),
          }}
        />
      </ExampleSection>
    </>
  );
}
