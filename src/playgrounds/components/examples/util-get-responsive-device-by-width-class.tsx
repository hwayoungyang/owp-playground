import { useEffect, useState } from 'react';
import {
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { getResponsiveDeviceByWidthClass, useOwpTranslation } from '@owp/components/hooks';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

const widthClasses = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [widthClass, setWidthClass] = useState<(typeof widthClasses)[number]>('md');
  const device = getResponsiveDeviceByWidthClass(widthClass);
  useEffect(() => {
    onData({
      all: widthClasses.map((value) => ({
        widthClass: value,
        device: getResponsiveDeviceByWidthClass(value),
      })),
      selected: { widthClass, device },
    });
  }, [onData, widthClass, device]);
  return (
    <>
      <ExampleSection
        title="모든 width class 비교"
        description="xs는 mobile, sm·md는 tablet, lg는 laptop, xl은 desktop에 대응합니다."
      >
        <Table size="small" aria-label={t('width class별 device')}>
          <TableHead>
            <TableRow>
              <TableCell>widthClass</TableCell>
              <TableCell>device</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {widthClasses.map((value) => (
              <TableRow key={value}>
                <TableCell>{value}</TableCell>
                <TableCell>{getResponsiveDeviceByWidthClass(value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ExampleSection>
      <ExampleSection
        title="선택한 class만 변환"
        description="함수는 전달한 class를 변환합니다. 브라우저 너비를 측정하거나 viewport를 바꾸지 않습니다."
      >
        <Stack spacing={2}>
          <TextField
            select
            label={t('MUI width class')}
            size="small"
            value={widthClass}
            onChange={(event) => {
              const next = widthClasses.find((value) => value === event.target.value);
              if (next) setWidthClass(next);
            }}
          >
            {widthClasses.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
          <ExampleResult value={{ widthClass, device }} />
        </Stack>
      </ExampleSection>
    </>
  );
}
