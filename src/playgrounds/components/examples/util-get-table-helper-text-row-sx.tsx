import { OwpTable } from '@owp/components';
import { useEffect } from 'react';
import { Box, TextField } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { getTableHelperTextRowSx } from '@owp/components/utils';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

function HelperTable({ helper, aligned }: { readonly helper: boolean; readonly aligned: boolean }) {
  const { t } = useOwpTranslation();
  return (
    <OwpTable
      size="small"
      aria-label={t('도움말 정렬 표')}
      headers={{ first: t('첫 번째 입력'), second: t('두 번째 입력') }}
      sx={[
        { '& th, & td': { textAlign: 'left' } },
        { '&&& tbody tr .owp-table-cell-content::after': { display: 'none' } },
        aligned ? { '& tbody tr': getTableHelperTextRowSx('components-helper-content') } : {},
      ]}
      rows={[
        {
          first: (
            <Box className="components-helper-content">
              <TextField
                label={t('첫 번째 입력')}
                size="small"
                helperText={helper ? t('입력값을 확인해 주세요.') : undefined}
                sx={{ minWidth: 160 }}
              />
            </Box>
          ),
          second: (
            <Box className="components-helper-content">
              <TextField label={t('두 번째 입력')} size="small" sx={{ minWidth: 160 }} />
            </Box>
          ),
        },
      ]}
    />
  );
}
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  useEffect(() => {
    onData({
      plain: { helper: false, aligned: true },
      mixed: { helper: true, aligned: false },
      corrected: { helper: true, aligned: true },
      sx: getTableHelperTextRowSx('components-helper-content'),
    });
  }, [onData]);
  return (
    <>
      <ExampleSection
        title="도움말이 없는 행"
        description="행에 입력 도움말이 없으면 추가 여백을 만들지 않습니다."
      >
        <HelperTable helper={false} aligned />
      </ExampleSection>
      <ExampleSection
        title="한 셀에만 도움말이 있는 행"
        description="보정 전의 표입니다. 첫 번째 입력의 도움말 때문에 입력 위치가 달라질 수 있습니다."
      >
        <HelperTable helper aligned={false} />
      </ExampleSection>
      <ExampleSection
        title="다른 셀에도 도움말 높이 확보"
        description="도움말이 없는 콘텐츠에 after 여백을 추가합니다. 도움말이 있는 콘텐츠에는 중복 추가하지 않습니다."
      >
        <HelperTable helper aligned />
      </ExampleSection>
    </>
  );
}
