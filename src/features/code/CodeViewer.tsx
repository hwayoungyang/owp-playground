import { Button, MenuItem, Select } from '@mui/material';
import { CheckIcon, CopyIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SampleInfo } from '../../shared/types/playground';
import { HighlightedCode } from './HighlightedCode';
import { highlightSource } from './highlight';
import { sampleSourcePath } from './source-paths';

const allSources = import.meta.glob<string>('/src/**/*.{ts,tsx,css}', {
  query: '?raw',
  import: 'default',
});

export function CodeViewer({
  sample,
  data,
  dataFormat = 'json',
  dataDescription,
}: {
  readonly sample: SampleInfo;
  readonly data?: string;
  readonly dataFormat?: 'json' | 'jsonc';
  readonly dataDescription?: string;
}) {
  const { t } = useTranslation('app');
  const initialFile = `/src/${sampleSourcePath(sample)}`;
  const [file, setFile] = useState(initialFile);
  const [source, setSource] = useState<{ readonly file: string; readonly content: string } | null>(
    null,
  );
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (data !== undefined) return;
    let active = true;
    const loader = allSources[file];
    if (loader)
      void loader()
        .then((value) => {
          if (active) setSource({ file, content: value });
        })
        .catch((error: unknown) => {
          if (error instanceof Error) {
            if (active) setNotice('소스를 불러오지 못했습니다.');
          } else throw error;
        });
    return () => {
      active = false;
    };
  }, [file, data]);
  const ready = data !== undefined || source?.file === file;
  const content = data ?? (source?.file === file ? source.content : '');
  const highlighted = useMemo(
    () =>
      highlightSource(
        content,
        data !== undefined ? dataFormat : file.endsWith('.css') ? 'css' : 'typescript',
      ),
    [content, data, dataFormat, file],
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setNotice('복사했습니다.');
    } catch (error) {
      if (error instanceof Error)
        setNotice('자동으로 복사하지 못했습니다. 코드를 선택해 복사할 수 있습니다.');
      else throw error;
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      data !== undefined ? `${sample.id}.${dataFormat}` : (file.split('/').at(-1) ?? 'sample.tsx');
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const files = [
    initialFile,
    ...Object.keys(allSources)
      .filter(
        (path) =>
          path !== initialFile &&
          (!path.startsWith('/src/playgrounds/') ||
            path.startsWith(`/src/playgrounds/${sample.package.replace(/^@owp\//, '')}/`)),
      )
      .sort(),
  ];
  return (
    <div className="code-viewer">
      <div className="code-toolbar">
        <div className="code-file">
          {data !== undefined ? (
            <span>
              data.{dataFormat} <small>{dataFormat.toUpperCase()}</small>
            </span>
          ) : (
            <Select
              value={file}
              onChange={(event) => {
                setFile(event.target.value);
                setCopied(false);
                setNotice('');
              }}
              inputProps={{ 'aria-label': t('소스 파일 선택') }}
            >
              {files.map((path) => (
                <MenuItem key={path} value={path}>
                  {files.filter((entry) => entry.split('/').at(-1) === path.split('/').at(-1))
                    .length > 1
                    ? path.replace('/src/', '')
                    : path.split('/').at(-1)}
                </MenuItem>
              ))}
            </Select>
          )}
        </div>
        <div>
          <Button disabled={!ready} onClick={download} startIcon={<DownloadSimpleIcon size={15} />}>
            {t('다운로드')}
          </Button>
          <Button
            onClick={copy}
            disabled={!ready}
            startIcon={copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
          >
            {t(copied ? '복사됨' : '복사')}
          </Button>
        </div>
      </div>
      <section
        className="code-scroll"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll the source region.
        tabIndex={0}
        aria-label={t(data !== undefined ? '데이터' : '실행 원본 코드')}
      >
        <pre>
          <HighlightedCode html={highlighted} />
        </pre>
      </section>
      <div className="code-status" role="status">
        {t(
          notice ||
            (!ready
              ? '소스를 불러오는 중…'
              : data !== undefined
                ? (dataDescription ?? '현재 화면에 적용된 가상 API 데이터입니다.')
                : '실행에 사용한 원본 코드입니다.'),
        )}
      </div>
    </div>
  );
}
