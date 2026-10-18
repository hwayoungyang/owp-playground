import { useOwpTranslation } from '@owp/components/hooks';
import { Alert, IconButton, Snackbar, Tooltip } from '@mui/material';
import { LinkIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { ExampleMetadata } from '../types/playground';

export function WorkspaceHeading({
  example,
  packageTitle,
  categoryLabel,
}: {
  readonly example: ExampleMetadata;
  readonly packageTitle: string;
  readonly categoryLabel: string;
}) {
  const { t } = useOwpTranslation();
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
      <div className="workspace-breadcrumb">
        <span>{packageTitle}</span>
        <span>/</span>
        <span>{t(categoryLabel)}</span>
      </div>
      <div className="workspace-heading">
        <div className="workspace-title-row">
          <h1>{t(example.title)}</h1>
          <Tooltip title={t('링크 복사')}>
            <IconButton className="share-button" onClick={copyLink} aria-label={t('링크 복사')}>
              <LinkIcon size={20} />
            </IconButton>
          </Tooltip>
        </div>
        {example.description && <p>{t(example.description)}</p>}
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
