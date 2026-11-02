import { TextField, Typography } from '@mui/material';
import { OwpSearchFilter } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState<{
    readonly search: { readonly query: string; readonly submitted: string | null };
    readonly running: boolean;
    readonly code: string;
    readonly skeleton: string;
  }>({ search: { query: '', submitted: null }, running: false, code: '', skeleton: '' }, props);
  return (
    <>
      <ExampleSection
        title="검색과 초기화"
        description="form submit과 reset을 각각 별도 callback에 연결합니다."
      >
        <OwpSearchFilter
          title={t('검색 조건')}
          onSubmit={() => {
            change('search', { ...values.search, submitted: values.search.query });
          }}
          onReset={() => change('search', { query: '', submitted: null })}
        >
          <TextField
            fullWidth
            size="small"
            label={t('항목명')}
            value={values.search.query}
            onChange={(event) => change('search', { ...values.search, query: event.target.value })}
            sx={{ maxWidth: 320 }}
          />
        </OwpSearchFilter>
        <Typography role="status" variant="body2">
          {values.search.submitted ?? t('검색 버튼을 눌러 주세요.')}
        </Typography>
      </ExampleSection>
      <ExampleSection
        title="조회 중 취소"
        description="isRunning이면 검색 버튼이 취소 버튼으로 바뀌며 onCancel을 호출합니다."
      >
        <OwpSearchFilter
          title={t('취소 가능한 조회')}
          isRunning={values.running}
          onSubmit={() => change('running', true)}
          onCancel={() => change('running', false)}
          onReset={() => change('running', false)}
        >
          <TextField
            size="small"
            label={t('조회 코드')}
            value={values.code}
            onChange={(event) => change('code', event.target.value)}
          />
        </OwpSearchFilter>
      </ExampleSection>
      <ExampleSection
        title="검색 필드 Skeleton"
        description="showSkeleton은 form과 조회 버튼 없이 필드 배치만 표시합니다."
      >
        <OwpSearchFilter showSkeleton>
          <TextField
            size="small"
            label={t('준비 중인 검색어')}
            value={values.skeleton}
            onChange={(event) => change('skeleton', event.target.value)}
          />
        </OwpSearchFilter>
      </ExampleSection>
    </>
  );
}
