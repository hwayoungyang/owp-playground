import { Alert, type AlertColor, Portal, Snackbar } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { useCallback, useState } from 'react';

type Notice = {
  readonly id: number;
  readonly message: string;
  readonly severity: AlertColor;
  readonly open: boolean;
};

export function useExampleFeedback({
  disablePortal = false,
}: { readonly disablePortal?: boolean } = {}) {
  const { t } = useOwpTranslation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = useCallback((message: string, severity: AlertColor = 'info') => {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, message, severity, open: true }));
  }, []);
  const dismiss = useCallback(() => {
    setNotice((current) => (current ? { ...current, open: false } : null));
  }, []);

  const feedback = notice && (
    <Portal disablePortal={disablePortal}>
      <Snackbar
        key={notice.id}
        open={notice.open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={notice.severity === 'error' ? null : 6000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') dismiss();
        }}
        sx={{ width: { xs: 'calc(100% - 32px)', sm: 'auto' }, maxWidth: 640 }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          role={notice.severity === 'error' ? 'alert' : 'status'}
          onClose={dismiss}
          closeText={t('닫기')}
          sx={{
            width: '100%',
            minWidth: { sm: 360 },
            fontSize: 15,
            lineHeight: 1.6,
            fontWeight: 500,
            padding: '12px 16px',
            boxShadow: 6,
            '& .MuiAlert-message': { overflowWrap: 'anywhere' },
          }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Portal>
  );

  return { notify, dismiss, feedback };
}
