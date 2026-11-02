import { useEffect } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { useOwpTranslation, useResponsiveDevice } from '@owp/components/hooks';
import { ExampleResult, useExampleData, type SectionObserver } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function DeviceSample({ id, report }: Omit<SectionObserver, 'onRecord'>) {
  const { t } = useOwpTranslation();
  const {
    widthClass,
    device,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isTabletOrDown,
    isLaptopUp,
  } = useResponsiveDevice();
  useEffect(() => {
    report(id, {
      widthClass,
      device,
      isMobile,
      isTablet,
      isLaptop,
      isDesktop,
      isTabletOrDown,
      isLaptopUp,
    });
  }, [
    report,
    id,
    widthClass,
    device,
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isTabletOrDown,
    isLaptopUp,
  ]);
  if (id === 'layout')
    return (
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', flexDirection: isTabletOrDown ? 'column' : 'row', gap: 2 }}>
          <Button variant="outlined">{t('검색')}</Button>
          <Button variant="outlined">{t('초기화')}</Button>
        </Box>
        <ExampleResult value={{ isTabletOrDown, isLaptopUp }} />
      </Stack>
    );
  if (id === 'notice')
    return (
      <Alert severity="info">
        {t(isMobile ? '모바일 viewport입니다.' : '모바일보다 넓은 viewport입니다.')}
      </Alert>
    );
  return <ExampleResult value={{ widthClass, device, isMobile, isTablet, isLaptop, isDesktop }} />;
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const report = useExampleData(onData);
  return (
    <>
      <ExampleSection
        title="현재 화면 크기 확인"
        description="각 예제는 실제 viewport를 독립적으로 구독합니다. 창 너비를 바꿔 비교하세요."
      >
        <DeviceSample id="state" report={report} />
      </ExampleSection>
      <ExampleSection
        title="넓이에 따라 버튼 배치"
        description="isTabletOrDown이 true이면 버튼을 세로로, false이면 가로로 배치합니다."
      >
        <DeviceSample id="layout" report={report} />
      </ExampleSection>
      <ExampleSection
        title="모바일 안내 구분"
        description="isMobile은 xs에서만 true입니다. 좁은 카드의 너비를 device로 해석하지 않습니다."
      >
        <DeviceSample id="notice" report={report} />
      </ExampleSection>
    </>
  );
}
