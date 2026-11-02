import { Button } from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
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
        description="DataGrid 스타일의 헤더 외곽선과 둥근 모서리를 함께 사용합니다."
      >
        <OwpTable
          title={t('DataGrid 항목 목록')}
          variant="dataGrid"
          radius
          size="small"
          headers={{ name: t('항목명'), status: t('상태'), amount: t('금액') }}
          rows={values.grid.map((row) => ({
            ...row,
            status: row.status === 'active' ? t('사용') : t('미사용'),
          }))}
        />
      </ExampleSection>
      <ExampleSection
        title="전체 건수와 footer"
        description="totalCount는 현재 표시한 row 수와 다른 전체 건수를 받을 수 있습니다."
      >
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
            <Button
              size="small"
              onClick={() => {
                change('total', [...values.total].reverse());
              }}
            >
              {t('표시 순서 뒤집기')}
            </Button>
          }
        />
      </ExampleSection>
    </>
  );
}
