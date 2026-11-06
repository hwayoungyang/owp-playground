import { useEffect } from 'react';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { getResponsiveTableMinWidthSx, mergeSx } from '@owp/components/utils';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function WidthTable({ minWidth }: { readonly minWidth?: number | string }) {
  const { t } = useOwpTranslation();
  return (
    <OwpTable
      size="small"
      aria-label={t('최소 폭 표')}
      sx={mergeSx(
        { '& th, & td': { textAlign: 'left' } },
        minWidth === undefined ? undefined : getResponsiveTableMinWidthSx(minWidth),
      )}
      headers={{ name: t('이름'), status: t('상태'), description: t('설명') }}
      rows={['Alpha', 'Beta'].map((name) => ({
        name,
        status: t('준비'),
        description: t('최소 너비를 비교하는 셀'),
      }))}
    />
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  useEffect(() => {
    onData({ withoutHelper: null, numeric: 720, cssLength: '60rem', appliesBelow: 'lg' });
  }, [onData]);
  return (
    <>
      <ExampleSection
        title="최소 너비를 지정하지 않은 표"
        description="기본 OwpTable입니다. 화면이 좁아지면 셀의 너비와 줄 수가 달라집니다."
      >
        <WidthTable />
      </ExampleSection>
      <ExampleSection
        title="숫자로 720px 지정"
        description="lg 미만 viewport에서 minWidth 720을 적용합니다. 넘친 내용은 표 안에서 스크롤합니다."
      >
        <WidthTable minWidth={720} />
      </ExampleSection>
      <ExampleSection
        title="CSS 길이로 60rem 지정"
        description="CSS 길이 문자열로도 지정할 수 있습니다. lg 이상에서는 최소 너비를 적용하지 않습니다."
      >
        <WidthTable minWidth="60rem" />
      </ExampleSection>
    </>
  );
}
