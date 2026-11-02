import { useId } from 'react';
import { Stack, Typography } from '@mui/material';
import { OwpTab, OwpTabs } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const id = useId();
  const [values, change] = useComponentExampleState(
    { owp: 'summary', mui: 'summary', vertical: 'summary' },
    props,
  );
  return (
    <>
      <ExampleSection title="OWP 기본 탭" description="OWP 스타일에서 요약과 상세 탭을 선택합니다.">
        <Stack spacing={2}>
          <OwpTabs
            value={values.owp}
            variant="owp"
            aria-label={t('OWP 기본 탭')}
            onChange={(_, next: string) => change('owp', next)}
          >
            <OwpTab
              id={`${id}-owp-summary`}
              aria-controls={`${id}-owp-panel`}
              value="summary"
              label={t('요약')}
            />
            <OwpTab
              id={`${id}-owp-detail`}
              aria-controls={`${id}-owp-panel`}
              value="detail"
              label={t('상세')}
            />
          </OwpTabs>
          <Typography
            variant="body2"
            role="tabpanel"
            tabIndex={0}
            id={`${id}-owp-panel`}
            aria-labelledby={`${id}-owp-${values.owp}`}
          >
            {values.owp === 'summary'
              ? t('선택한 항목의 요약입니다.')
              : t('선택한 항목의 상세 정보입니다.')}
          </Typography>
        </Stack>
      </ExampleSection>
      <ExampleSection title="MUI 기본 탭" description="동일한 OwpTab을 MUI 스타일로 표시합니다.">
        <Stack spacing={2}>
          <OwpTabs
            value={values.mui}
            variant="mui"
            aria-label={t('MUI 기본 탭')}
            onChange={(_, next: string) => change('mui', next)}
          >
            <OwpTab
              id={`${id}-mui-summary`}
              aria-controls={`${id}-mui-panel`}
              value="summary"
              label={t('요약')}
            />
            <OwpTab
              id={`${id}-mui-detail`}
              aria-controls={`${id}-mui-panel`}
              value="detail"
              label={t('상세')}
            />
          </OwpTabs>
          <Typography
            variant="body2"
            role="tabpanel"
            tabIndex={0}
            id={`${id}-mui-panel`}
            aria-labelledby={`${id}-mui-${values.mui}`}
          >
            {values.mui === 'summary'
              ? t('선택한 항목의 요약입니다.')
              : t('선택한 항목의 상세 정보입니다.')}
          </Typography>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="세로 탭과 비활성 항목"
        description="orientation과 disabled로 세로 탐색과 선택 불가 항목을 구성합니다."
      >
        <Stack spacing={2}>
          <OwpTabs
            value={values.vertical}
            variant="mui"
            orientation="vertical"
            aria-label={t('세로 탭과 비활성 항목')}
            onChange={(_, next: string) => change('vertical', next)}
          >
            <OwpTab
              id={`${id}-vertical-summary`}
              aria-controls={`${id}-vertical-panel`}
              value="summary"
              label={t('요약')}
            />
            <OwpTab
              id={`${id}-vertical-detail`}
              aria-controls={`${id}-vertical-panel`}
              value="detail"
              label={t('상세')}
            />
            <OwpTab value="disabled" label={t('선택 불가')} disabled />
          </OwpTabs>
          <Typography
            variant="body2"
            role="tabpanel"
            tabIndex={0}
            id={`${id}-vertical-panel`}
            aria-labelledby={`${id}-vertical-${values.vertical}`}
          >
            {values.vertical === 'summary'
              ? t('선택한 항목의 요약입니다.')
              : t('선택한 항목의 상세 정보입니다.')}
          </Typography>
        </Stack>
      </ExampleSection>
    </>
  );
}
