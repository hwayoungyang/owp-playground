import { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { OwpResponsiveDevice } from '@owp/components/types';
import { getResponsiveDeviceMediaQuery, useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

const devices = ['mobile', 'tablet', 'laptop', 'desktop'] as const;
const customTheme = createTheme({
  breakpoints: { values: { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440 } },
});
function QueryRow({
  theme,
  device,
}: {
  readonly theme: Theme;
  readonly device: OwpResponsiveDevice;
}) {
  const query = getResponsiveDeviceMediaQuery(theme, device);
  const matches = useMediaQuery(query);
  return (
    <TableRow>
      <TableCell>{device}</TableCell>
      <TableCell sx={{ overflowWrap: 'anywhere' }}>{query}</TableCell>
      <TableCell>{String(matches)}</TableCell>
    </TableRow>
  );
}
function QueryTable({ theme }: { readonly theme: Theme }) {
  const { t } = useOwpTranslation();
  return (
    <TableContainer>
      <Table size="small" aria-label={t('device별 media query')}>
        <TableHead>
          <TableRow>
            <TableCell>device</TableCell>
            <TableCell>query</TableCell>
            <TableCell>matches</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {devices.map((device) => (
            <QueryRow key={device} theme={theme} device={device} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const theme = useTheme();
  const mobile = useMediaQuery(getResponsiveDeviceMediaQuery(theme, 'mobile'));
  const tablet = useMediaQuery(getResponsiveDeviceMediaQuery(theme, 'tablet'));
  const laptop = useMediaQuery(getResponsiveDeviceMediaQuery(theme, 'laptop'));
  const desktop = useMediaQuery(getResponsiveDeviceMediaQuery(theme, 'desktop'));
  const customMobile = useMediaQuery(getResponsiveDeviceMediaQuery(customTheme, 'mobile'));
  const customTablet = useMediaQuery(getResponsiveDeviceMediaQuery(customTheme, 'tablet'));
  const customLaptop = useMediaQuery(getResponsiveDeviceMediaQuery(customTheme, 'laptop'));
  const customDesktop = useMediaQuery(getResponsiveDeviceMediaQuery(customTheme, 'desktop'));
  useEffect(() => {
    onData({
      current: {
        queries: devices.map((device) => ({
          device,
          query: getResponsiveDeviceMediaQuery(theme, device),
        })),
        matches: { mobile, tablet, laptop, desktop },
      },
      custom: {
        queries: devices.map((device) => ({
          device,
          query: getResponsiveDeviceMediaQuery(customTheme, device),
        })),
        matches: {
          mobile: customMobile,
          tablet: customTablet,
          laptop: customLaptop,
          desktop: customDesktop,
        },
      },
    });
  }, [
    onData,
    theme,
    mobile,
    tablet,
    laptop,
    desktop,
    customMobile,
    customTablet,
    customLaptop,
    customDesktop,
  ]);
  return (
    <>
      <ExampleSection
        title="현재 theme의 media query"
        description="4개 device의 조건을 동시에 표시합니다. matches는 현재 viewport와 일치하는지 나타냅니다."
      >
        <QueryTable theme={theme} />
      </ExampleSection>
      <ExampleSection
        title="breakpoint를 바꾼 theme"
        description="별도 theme의 sm=480, lg=1024, xl=1440 값을 사용합니다. 앱 전체 theme는 바꾸지 않습니다."
      >
        <QueryTable theme={customTheme} />
      </ExampleSection>
    </>
  );
}
