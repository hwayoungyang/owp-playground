import { Button, Chip, Typography } from '@mui/material';
import { OwpSection } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState({ actionCount: 0, loading: false }, props);
  return (
    <>
      <ExampleSection
        title="제목과 구분선"
        description="제목 아래에 구분선을 넣어 본문과 나눕니다."
      >
        <OwpSection title={t('기본 섹션')} showDivider>
          <Typography variant="body2" sx={{ pt: 2 }}>
            {t('이 영역은 기본 섹션 본문입니다.')}
          </Typography>
        </OwpSection>
      </ExampleSection>
      <ExampleSection
        title="보조 정보와 작업 버튼"
        description="leftSlot·centerSlot에 보조 정보를, actions에 작업 버튼을 배치합니다."
      >
        <OwpSection
          title={t('항목 목록')}
          leftSlot={<Chip size="small" label={t('두 항목')} />}
          centerSlot={<Typography variant="caption">{t('보조 정보')}</Typography>}
          actions={
            <Button
              variant="outlined"
              size="small"
              onClick={() => change('actionCount', values.actionCount + 1)}
            >
              {t('목록 새로고침')}
            </Button>
          }
        >
          <Typography variant="body2">
            {t('제목과 보조 정보, 작업 버튼을 함께 배치합니다.')}
          </Typography>
        </OwpSection>
      </ExampleSection>
      <ExampleSection
        title="제목 아이콘과 로딩"
        description="기본 아이콘을 숨기고 loading으로 제목 옆에 로딩 표시를 켭니다."
      >
        <Button variant="outlined" onClick={() => change('loading', !values.loading)}>
          {t('섹션 로딩 전환')}
        </Button>
        <OwpSection
          title={t('로딩이 있는 섹션')}
          disableTitleIcon
          loading={values.loading}
          showDivider={false}
        >
          <Typography variant="body2">{t('로딩을 표시해도 기존 본문을 유지합니다.')}</Typography>
        </OwpSection>
      </ExampleSection>
    </>
  );
}
