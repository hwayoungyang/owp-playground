import { Alert, Button, Snackbar } from '@mui/material';
import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HighlightedCode } from './HighlightedCode';
import { highlightSource } from './highlight';

export function CodeSnippet({
  label,
  code,
  language,
}: {
  readonly label: string;
  readonly code: string;
  readonly language?: 'typescript' | 'json' | 'css';
}) {
  const { t } = useTranslation('app');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => (language ? highlightSource(code, language) : null), [code, language]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setNotice('복사했습니다.');
    } catch (error) {
      if (error instanceof Error)
        setNotice('자동으로 복사하지 못했습니다. 코드를 선택해 복사할 수 있습니다.');
      else throw error;
    }
  };
  return (
    <>
      <div className="guide-code code-viewer">
        <div className="code-toolbar">
          <span className="code-file">{label}</span>
          <Button
            onClick={copy}
            aria-label={`${label} ${t('복사')}`}
            startIcon={copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
          >
            {t(copied ? '복사됨' : '복사')}
          </Button>
        </div>
        <section
          className="code-scroll"
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll the source region.
          tabIndex={0}
          aria-label={label}
        >
          <pre>{html ? <HighlightedCode html={html} /> : <code>{code}</code>}</pre>
        </section>
      </div>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setNotice('');
        }}
      >
        <Alert
          severity={notice === '복사했습니다.' ? 'success' : 'error'}
          onClose={() => setNotice('')}
        >
          {t(notice)}
        </Alert>
      </Snackbar>
    </>
  );
}
