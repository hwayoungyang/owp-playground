import { useOwpTranslation } from '@owp/components/hooks';
import { Button } from '@mui/material';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';

export function ResetButton({ onReset }: { readonly onReset: () => void }) {
  const { t } = useOwpTranslation();
  return (
    <Button
      className="workspace-reset-button"
      variant="outlined"
      onClick={onReset}
      startIcon={<ArrowsClockwiseIcon size={15} aria-hidden />}
    >
      {t('초기화')}
    </Button>
  );
}
