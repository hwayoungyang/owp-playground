import { Button, Stack, Typography } from '@mui/material';
import { OwpPageCarded } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState({ leftOpen: false, rightOpen: false }, props);
  return (
    <>
      <ExampleSection
        title="헤더와 카드 본문"
        description="scroll이 normal인 페이지에 헤더와 본문을 전달합니다."
      >
        <OwpPageCarded
          scroll="normal"
          fillContentHeight={false}
          sx={{ minHeight: 160, height: 'auto' }}
          header={<Typography variant="subtitle2">{t('페이지 헤더')}</Typography>}
          content={
            <Typography variant="body2">{t('카드 안에 표시한 페이지 본문입니다.')}</Typography>
          }
        />
      </ExampleSection>
      <ExampleSection
        title="왼쪽 임시 사이드바"
        description="temporary sidebar를 별도 버튼으로 열고 닫습니다."
      >
        <Button variant="outlined" onClick={() => change('leftOpen', true)}>
          {t('왼쪽 임시 사이드바 열기')}
        </Button>
        <OwpPageCarded
          scroll="normal"
          fillContentHeight={false}
          sx={{ minHeight: 160, height: 'auto' }}
          leftSidebarOpen={values.leftOpen}
          leftSidebarVariant="temporary"
          leftSidebarWidth={240}
          leftSidebarOnClose={() => change('leftOpen', false)}
          leftSidebarContent={
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography>{t('왼쪽 임시 사이드바')}</Typography>
              <Button onClick={() => change('leftOpen', false)}>{t('사이드바 닫기')}</Button>
            </Stack>
          }
          content={
            <Typography variant="body2">
              {t('사이드바는 본문과 별도 영역으로 열립니다.')}
            </Typography>
          }
        />
      </ExampleSection>
      <ExampleSection
        title="오른쪽 임시 사이드바"
        description="temporary sidebar를 별도 버튼으로 열고 닫습니다."
      >
        <Button variant="outlined" onClick={() => change('rightOpen', true)}>
          {t('오른쪽 임시 사이드바 열기')}
        </Button>
        <OwpPageCarded
          scroll="normal"
          fillContentHeight={false}
          sx={{ minHeight: 160, height: 'auto' }}
          rightSidebarOpen={values.rightOpen}
          rightSidebarVariant="temporary"
          rightSidebarWidth={240}
          rightSidebarOnClose={() => change('rightOpen', false)}
          rightSidebarContent={
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography>{t('오른쪽 임시 사이드바')}</Typography>
              <Button onClick={() => change('rightOpen', false)}>{t('사이드바 닫기')}</Button>
            </Stack>
          }
          content={
            <Typography variant="body2">
              {t('사이드바는 본문과 별도 영역으로 열립니다.')}
            </Typography>
          }
        />
      </ExampleSection>
    </>
  );
}
