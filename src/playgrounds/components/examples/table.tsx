import { useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [footerMode, setFooterMode] = useState<'slot' | 'count'>('slot');
  const [values, change] = useComponentExampleState(
    {
      mui: [
        { name: 'A', status: 'active', amount: 1200 },
        { name: 'B', status: 'inactive', amount: 2400 },
      ],
      grid: [
        { name: 'A', status: 'active', amount: 1200 },
        { name: 'B', status: 'inactive', amount: 2400 },
      ],
      total: [
        { name: 'A', status: 'active', amount: 1200 },
        { name: 'B', status: 'inactive', amount: 2400 },
      ],
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="MUI 기본 표"
        description="MUI 스타일과 small 크기로 단순 목록을 표시합니다."
      >
        <OwpTable
          title={t('기본 항목 목록')}
          variant="mui"
          size="small"
          headers={{ name: t('항목명'), status: t('상태'), amount: t('금액') }}
          rows={values.mui.map((row) => ({
            ...row,
            status: row.status === 'active' ? t('사용') : t('미사용'),
          }))}
        />
      </ExampleSection>
      <ExampleSection
        title="DataGrid 스타일 표"
        description="DataGrid 스타일에서 항목명은 두 헤더 행에 걸치고, 항목 정보는 상태와 금액 두 열을 묶습니다."
      >
        <OwpTable
          title={t('DataGrid 항목 목록')}
          variant="dataGrid"
          radius
          size="small"
          headers={[
            { name: t('항목명'), nameRowSpan: 2, details: t('항목 정보'), detailsColSpan: 2 },
            { status: t('상태'), amount: t('금액') },
          ]}
          rows={values.grid.map((row) => ({
            ...row,
            status: row.status === 'active' ? t('사용') : t('미사용'),
          }))}
        />
      </ExampleSection>
      <ExampleSection
        title="전체 건수와 footer"
        description="totalCount는 현재 표시한 row 수와 다른 전체 건수를 받을 수 있습니다. footerSlot을 지정하거나 생략해 사용자 footer와 기본 건수 footer를 비교합니다."
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={footerMode}
          aria-label={t('footer 비교')}
          onChange={(_, next: 'slot' | 'count' | null) => {
            if (next !== null) setFooterMode(next);
          }}
        >
          <ToggleButton value="slot">{t('footerSlot 사용')}</ToggleButton>
          <ToggleButton value="count">{t('기본 건수 footer')}</ToggleButton>
        </ToggleButtonGroup>
        <OwpTable
          title={t('전체 건수가 있는 목록')}
          variant="mui"
          radius={false}
          headers={{ name: t('항목명'), status: t('상태'), amount: t('금액') }}
          rows={values.total.map((row) => ({
            ...row,
            status: row.status === 'active' ? t('사용') : t('미사용'),
          }))}
          canTotalCountRow
          totalCount={12}
          footerSlot={
            footerMode === 'slot' ? (
              <Button
                size="small"
                onClick={() => {
                  change('total', [...values.total].reverse());
                }}
              >
                {t('표시 순서 뒤집기')}
              </Button>
            ) : undefined
          }
        />
      </ExampleSection>
    </>
  );
}
