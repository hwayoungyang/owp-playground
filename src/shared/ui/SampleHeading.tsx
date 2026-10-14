import { Alert, IconButton, Snackbar, Tooltip } from '@mui/material';
import { LinkIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SampleInfo } from '../types/playground';

export function SampleHeading({
  sample,
  packageTitle,
  categoryLabel,
}: {
  readonly sample: SampleInfo;
  readonly packageTitle: string;
  readonly categoryLabel: string;
}) {
  const { t } = useTranslation('app');
  const [notice, setNotice] = useState('');
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setNotice('링크를 복사했습니다.');
    } catch (error) {
      if (error instanceof Error)
        setNotice('자동으로 복사하지 못했습니다. 주소창에서 링크를 복사할 수 있습니다.');
      else throw error;
    }
  };
  return (
    <>
      <div className="sample-breadcrumb">
        <span>{packageTitle}</span>
        <span>/</span>
        <span>{t(categoryLabel)}</span>
      </div>
      <div className="sample-heading">
        <div className="sample-title-row">
          <h1>{t(sample.title)}</h1>
          <Tooltip title={t('링크 복사')}>
            <IconButton className="share-button" onClick={copyLink} aria-label={t('링크 복사')}>
              <LinkIcon size={20} />
            </IconButton>
          </Tooltip>
        </div>
        {sample.description && <p>{t(sample.description)}</p>}
      </div>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setNotice('');
        }}
      >
        <Alert
          severity={notice === '링크를 복사했습니다.' ? 'success' : 'error'}
          onClose={() => setNotice('')}
        >
          {t(notice)}
        </Alert>
      </Snackbar>
    </>
  );
}
