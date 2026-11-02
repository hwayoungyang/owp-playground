import { Button, Stack, TextField, Typography } from '@mui/material';
import { OwpFloatingPanel } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      normal: { open: false, memo: '' },
      fullscreen: { open: false, memo: '' },
      title: { open: false, memo: '' },
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="이동과 크기 조절"
        description="기본 패널을 이동·조절하고 별도 창으로 분리합니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('normal', { ...values.normal, open: true })}
        >
          {t('기본 패널 열기')}
        </Button>
        <OwpFloatingPanel
          open={values.normal.open}
          title={t('이동과 크기 조절')}
          windowTitle={t('이동과 크기 조절')}
          closeText={t('닫기')}
          dockText={t('앱으로 돌아오기')}
          popoutText={t('별도 창으로 열기')}
          popupWindowName="components-normal"
          storageKey="components-normal"
          onClose={() => change('normal', { ...values.normal, open: false })}
        >
          {({ detached }) => (
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography variant="body2">
                {detached ? t('별도 창에서 편집 중입니다.') : t('앱 패널에서 편집 중입니다.')}
              </Typography>
              <TextField
                multiline
                minRows={3}
                label={t('메모')}
                value={values.normal.memo}
                onChange={(event) =>
                  change('normal', { ...values.normal, memo: event.target.value })
                }
              />
            </Stack>
          )}
        </OwpFloatingPanel>
      </ExampleSection>
      <ExampleSection
        title="전체 화면 패널"
        description="fullscreen 패널은 viewport를 채우며 별도 창 분리도 지원합니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('fullscreen', { ...values.fullscreen, open: true })}
        >
          {t('전체 화면 패널 열기')}
        </Button>
        <OwpFloatingPanel
          open={values.fullscreen.open}
          title={t('전체 화면 패널')}
          windowTitle={t('전체 화면 패널')}
          fullscreen
          closeText={t('닫기')}
          dockText={t('앱으로 돌아오기')}
          popoutText={t('별도 창으로 열기')}
          popupWindowName="components-fullscreen"
          storageKey="components-fullscreen"
          onClose={() => change('fullscreen', { ...values.fullscreen, open: false })}
        >
          {({ detached }) => (
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography variant="body2">
                {detached ? t('별도 창에서 편집 중입니다.') : t('앱 패널에서 편집 중입니다.')}
              </Typography>
              <TextField
                multiline
                minRows={3}
                label={t('메모')}
                value={values.fullscreen.memo}
                onChange={(event) =>
                  change('fullscreen', { ...values.fullscreen, memo: event.target.value })
                }
              />
            </Stack>
          )}
        </OwpFloatingPanel>
      </ExampleSection>
      <ExampleSection
        title="제목 안의 전환 버튼"
        description="headerActionPlacement와 title slot의 frameAction으로 전환 버튼을 제목 안에 배치합니다."
      >
        <Button variant="outlined" onClick={() => change('title', { ...values.title, open: true })}>
          {t('제목에 전환 버튼이 있는 패널 열기')}
        </Button>
        <OwpFloatingPanel
          open={values.title.open}
          title={({ frameAction }) => (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <span>{t('제목 안의 전환 버튼')}</span>
              {frameAction}
            </Stack>
          )}
          windowTitle={t('제목 안의 전환 버튼')}
          headerActionPlacement="title"
          closeText={t('닫기')}
          dockText={t('앱으로 돌아오기')}
          popoutText={t('별도 창으로 열기')}
          popupWindowName="components-title"
          storageKey="components-title"
          onClose={() => change('title', { ...values.title, open: false })}
        >
          {({ detached }) => (
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography variant="body2">
                {detached ? t('별도 창에서 편집 중입니다.') : t('앱 패널에서 편집 중입니다.')}
              </Typography>
              <TextField
                multiline
                minRows={3}
                label={t('메모')}
                value={values.title.memo}
                onChange={(event) => change('title', { ...values.title, memo: event.target.value })}
              />
            </Stack>
          )}
        </OwpFloatingPanel>
      </ExampleSection>
    </>
  );
}
