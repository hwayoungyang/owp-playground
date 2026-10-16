import { Button } from '@mui/material';
import { ArrowsClockwiseIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export function ResetButton({ onReset }: { readonly onReset: () => void }) {
  const { t } = useTranslation('app');
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
