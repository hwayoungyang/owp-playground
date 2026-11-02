import { Button, Chip, Typography } from '@mui/material';
import { OwpPageContent } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState({ savedCount: 0, loading: false }, props);
  return (
    <>
      <ExampleSection
        title="제목과 본문 분리"
        description="제목을 header에 배치하고 children을 본문에 표시합니다."
      >
        <OwpPageContent title={t('기본 페이지 본문')}>
          <Typography variant="body2">{t('페이지의 주요 콘텐츠입니다.')}</Typography>
        </OwpPageContent>
      </ExampleSection>
      <ExampleSection
        title="페이지 작업과 보조 정보"
        description="leftSlot과 actions를 제목 옆에 배치합니다."
      >
        <OwpPageContent
          title={t('작업이 있는 페이지')}
          leftSlot={<Chip size="small" label={t('편집 가능')} />}
          actions={
            <Button
              variant="outlined"
              size="small"
              onClick={() => change('savedCount', values.savedCount + 1)}
            >
              {t('페이지 저장')}
            </Button>
          }
        >
          <Typography variant="body2">
            {t('저장 버튼의 실행 횟수는 Data에서 볼 수 있습니다.')}
          </Typography>
        </OwpPageContent>
      </ExampleSection>
      <ExampleSection
        title="페이지 제목 로딩"
        description="loading을 바꾸면 제목 영역의 진행 표시가 달라집니다."
      >
        <Button variant="outlined" onClick={() => change('loading', !values.loading)}>
          {t('페이지 로딩 전환')}
        </Button>
        <OwpPageContent title={t('목록 조회 페이지')} loading={values.loading}>
          <Typography variant="body2">{t('페이지의 주요 콘텐츠입니다.')}</Typography>
        </OwpPageContent>
      </ExampleSection>
    </>
  );
}
