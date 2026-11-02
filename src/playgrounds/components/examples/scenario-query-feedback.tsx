import { Box, Button, Stack, Typography } from '@mui/material';
import { OwpLoading, OwpSection, OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

const rows = [
  { code: 'A-100', name: '센서 모듈', quantity: 24 },
  { code: 'B-200', name: '제어 보드', quantity: 12 },
] as const;
const states = [
  { id: 'results', label: '결과 표시' },
  { id: 'loading', label: '조회 중' },
  { id: 'empty', label: '결과 없음' },
] as const;

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState<{
    readonly status: 'results' | 'loading' | 'empty';
  }>({ status: 'results' }, props);
  return (
    <ExampleSection
      title="조회 상태에 따른 결과 영역"
      description="버튼으로 조회 중·결과 없음·결과 표시를 비교합니다. 실제 요청이나 자동 완료는 수행하지 않습니다."
    >
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexWrap: 'wrap' }}
        role="group"
        aria-label={t('조회 상태')}
      >
        {states.map((state) => (
          <Button
            key={state.id}
            variant={values.status === state.id ? 'contained' : 'outlined'}
            aria-pressed={values.status === state.id}
            onClick={() => change('status', state.id)}
          >
            {t(state.label)}
          </Button>
        ))}
      </Stack>
      <OwpSection title={t('조회 결과')} loading={values.status === 'loading'}>
        <Box aria-busy={values.status === 'loading'} sx={{ minHeight: 120 }}>
          {values.status === 'loading' ? (
            <>
              <Typography role="status">{t('조회 중입니다.')}</Typography>
              <OwpLoading variant="linear" delay={0} ariaLabel={t('조회 중')} />
            </>
          ) : values.status === 'empty' ? (
            <Typography role="status">
              {t('검색 결과가 없습니다. 조건을 변경해 다시 조회해 주세요.')}
            </Typography>
          ) : (
            <OwpTable
              aria-label={t('조회 결과')}
              headers={{ code: t('품목 코드'), name: t('항목명'), quantity: t('재고 수량') }}
              rows={rows.map((row) => ({ ...row, name: t(row.name) }))}
              size="small"
              canTotalCountRow
              totalCount={rows.length}
              containerProps={{ sx: { overflowX: 'auto' } }}
            />
          )}
        </Box>
      </OwpSection>
    </ExampleSection>
  );
}
