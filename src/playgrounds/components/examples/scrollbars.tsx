import { Box, Button, Stack, Typography } from '@mui/material';
import { OwpScrollbars, OwpScrollbarsProvider } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    { customReset: 0, nativeReset: 0, horizontalReset: 0 },
    props,
  );
  return (
    <>
      <ExampleSection
        title="사용자 지정 세로 scrollbar"
        description="provider를 켜고 세로 목록의 끝 도달 이벤트를 받습니다. 터치·작은 화면은 기본 scrollbar를 사용합니다."
      >
        <Button variant="outlined" onClick={() => change('customReset', values.customReset + 1)}>
          {t('스크롤 위치 초기화')}
        </Button>
        <Box sx={{ height: 240, minHeight: 0, '& > div': { height: '100%' } }}>
          <OwpScrollbarsProvider enabled={true}>
            <OwpScrollbars
              resetKey={values.customReset}
              scrollToTopOnChildChange={false}
              option={{ suppressScrollX: true }}
              onYReachEnd={() => props.onRecord('custom.end', t('세로 목록 끝에 도달했습니다.'))}
            >
              <Stack spacing={2} sx={{ p: 2 }}>
                {Array.from({ length: 15 }, (_, index) => (
                  <Typography key={index} variant="body2">
                    {t('스크롤 항목 {{index}}', { index: index + 1 })}
                  </Typography>
                ))}
              </Stack>
            </OwpScrollbars>
          </OwpScrollbarsProvider>
        </Box>
      </ExampleSection>
      <ExampleSection
        title="기본 scrollbar"
        description="enabled가 false인 provider는 브라우저 기본 scrollbar를 사용합니다."
      >
        <Button variant="outlined" onClick={() => change('nativeReset', values.nativeReset + 1)}>
          {t('스크롤 위치 초기화')}
        </Button>
        <Box sx={{ height: 240, minHeight: 0, '& > div': { height: '100%' } }}>
          <OwpScrollbarsProvider enabled={false}>
            <OwpScrollbars
              resetKey={values.nativeReset}
              scrollToTopOnChildChange={false}
              option={{ suppressScrollX: true }}
              onYReachEnd={() => props.onRecord('native.end', t('세로 목록 끝에 도달했습니다.'))}
            >
              <Stack spacing={2} sx={{ p: 2 }}>
                {Array.from({ length: 15 }, (_, index) => (
                  <Typography key={index} variant="body2">
                    {t('스크롤 항목 {{index}}', { index: index + 1 })}
                  </Typography>
                ))}
              </Stack>
            </OwpScrollbars>
          </OwpScrollbarsProvider>
        </Box>
      </ExampleSection>
      <ExampleSection
        title="가로와 세로 스크롤"
        description="suppressScrollX가 false인 컨테이너에 폭이 넓은 콘텐츠를 넣습니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('horizontalReset', values.horizontalReset + 1)}
        >
          {t('스크롤 위치 초기화')}
        </Button>
        <Box sx={{ height: 240, minHeight: 0, '& > div': { height: '100%' } }}>
          <OwpScrollbarsProvider enabled={true}>
            <OwpScrollbars
              resetKey={values.horizontalReset}
              scrollToTopOnChildChange={false}
              option={{ suppressScrollX: false }}
              onYReachEnd={() =>
                props.onRecord('horizontal.end', t('세로 목록 끝에 도달했습니다.'))
              }
            >
              <Stack spacing={2} sx={{ p: 2, minWidth: 720 }}>
                {Array.from({ length: 15 }, (_, index) => (
                  <Typography key={index} variant="body2">
                    {t('스크롤 항목 {{index}}', { index: index + 1 })}
                  </Typography>
                ))}
              </Stack>
            </OwpScrollbars>
          </OwpScrollbarsProvider>
        </Box>
      </ExampleSection>
    </>
  );
}
