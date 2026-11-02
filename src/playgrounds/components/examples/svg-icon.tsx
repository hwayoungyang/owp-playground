import { Button, Stack } from '@mui/material';
import { OwpSvgIcon } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { sizes: [16, 24, 32], buttonClicks: 0 },
    props,
  );
  return (
    <>
      <ExampleSection
        title="아이콘 크기"
        description="같은 sprite 아이콘을 16·24·32px 크기로 표시합니다."
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <OwpSvgIcon size={16} aria-hidden="true">
            heroicons-outline:arrow-down-tray
          </OwpSvgIcon>
          <OwpSvgIcon size={24} aria-hidden="true">
            heroicons-outline:arrow-down-tray
          </OwpSvgIcon>
          <OwpSvgIcon size={32} aria-hidden="true">
            heroicons-outline:arrow-down-tray
          </OwpSvgIcon>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="theme 색상과 접근성 이름"
        description="color로 theme palette를 사용하고 의미 있는 아이콘에 접근성 이름을 붙입니다."
      >
        <Stack direction="row" spacing={2}>
          <OwpSvgIcon color="action" role="img" aria-label={t('다운로드')}>
            heroicons-outline:arrow-down-tray
          </OwpSvgIcon>
          <OwpSvgIcon color="disabled" role="img" aria-label={t('사용할 수 없는 다운로드')}>
            heroicons-outline:arrow-down-tray
          </OwpSvgIcon>
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="버튼 안의 장식 아이콘"
        description="버튼에 이름이 있으므로 아이콘은 aria-hidden으로 숨깁니다."
      >
        <Button
          variant="outlined"
          startIcon={
            <OwpSvgIcon size={20} aria-hidden="true">
              heroicons-outline:arrow-down-tray
            </OwpSvgIcon>
          }
          onClick={() => change('buttonClicks', values.buttonClicks + 1)}
        >
          {t('다운로드 요청 기록')}
        </Button>
      </ExampleSection>
    </>
  );
}
