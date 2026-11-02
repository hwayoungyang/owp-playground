import { Button, Typography } from '@mui/material';
import { OwpResponsiveLayoutGlobalStyles, OwpPageContent } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { responsiveActions: 0, fixedActions: 0 },
    props,
  );
  return (
    <>
      <OwpResponsiveLayoutGlobalStyles />
      <ExampleSection
        title="반응형 페이지 배치"
        description="공통 GlobalStyles와 responsiveLayout을 사용해 lg 미만에서 제목·slot·작업을 세로로 배치합니다."
      >
        <OwpPageContent
          title={t('페이지 제목')}
          responsiveLayout={true}
          centerSlot={<Typography variant="caption">{t('보조 정보')}</Typography>}
          actions={
            <Button
              variant="outlined"
              size="small"
              onClick={() => change('responsiveActions', values.responsiveActions + 1)}
            >
              {t('작업 실행')}
            </Button>
          }
        >
          <Typography variant="body2">
            {t('창 너비를 조절하며 제목과 버튼의 배치를 비교해 보세요.')}
          </Typography>
        </OwpPageContent>
      </ExampleSection>
      <ExampleSection
        title="반응형 배치 비활성화"
        description="같은 구조에서 responsiveLayout을 끄고 기존 header 배치를 유지합니다."
      >
        <OwpPageContent
          title={t('페이지 제목')}
          responsiveLayout={false}
          centerSlot={<Typography variant="caption">{t('보조 정보')}</Typography>}
          actions={
            <Button
              variant="outlined"
              size="small"
              onClick={() => change('fixedActions', values.fixedActions + 1)}
            >
              {t('작업 실행')}
            </Button>
          }
        >
          <Typography variant="body2">
            {t('창 너비를 조절하며 제목과 버튼의 배치를 비교해 보세요.')}
          </Typography>
        </OwpPageContent>
      </ExampleSection>
    </>
  );
}
