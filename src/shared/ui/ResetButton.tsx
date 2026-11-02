import { useOwpTranslation } from '@owp/components/hooks';
import { Button, Tooltip } from '@mui/material';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';

export function ResetButton({ onReset }: { readonly onReset: () => void }) {
  const { t } = useOwpTranslation();
  return (
    <Tooltip title={t('현재 예제의 초기 상태로 되돌립니다.')} describeChild>
      <Button
        className="workspace-reset-button"
        variant="outlined"
        onClick={onReset}
        startIcon={<ArrowsClockwiseIcon size={15} aria-hidden />}
      >
        {t('초기화')}
      </Button>
    </Tooltip>
  );
}
