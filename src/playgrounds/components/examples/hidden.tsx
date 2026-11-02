import { Typography } from '@mui/material';
import { OwpHidden } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  useComponentExampleState(
    { small: { smDown: true }, large: { lgUp: true }, middle: { smDown: true, lgUp: true } },
    props,
  );
  return (
    <>
      <ExampleSection
        title="sm 미만에서 숨김"
        description="smDown은 MUI theme의 sm breakpoint 미만에서 children을 숨깁니다."
      >
        <OwpHidden smDown>
          <Typography variant="body2">
            {t('이 문장은 현재 breakpoint 조건에서 보입니다.')}
          </Typography>
        </OwpHidden>
      </ExampleSection>
      <ExampleSection
        title="lg 이상에서 숨김"
        description="lgUp은 lg breakpoint 이상에서 children을 숨깁니다."
      >
        <OwpHidden lgUp>
          <Typography variant="body2">
            {t('이 문장은 현재 breakpoint 조건에서 보입니다.')}
          </Typography>
        </OwpHidden>
      </ExampleSection>
      <ExampleSection
        title="중간 너비에서만 표시"
        description="smDown과 lgUp을 함께 지정해 sm 이상·lg 미만에서만 표시합니다."
      >
        <OwpHidden smDown lgUp>
          <Typography variant="body2">
            {t('이 문장은 현재 breakpoint 조건에서 보입니다.')}
          </Typography>
        </OwpHidden>
      </ExampleSection>
    </>
  );
}
