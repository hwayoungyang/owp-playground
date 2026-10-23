import { useOwpTranslation } from '@owp/components/hooks';
import { Button, ListSubheader, MenuItem, Select } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CheckIcon, CopyIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import dependencies from 'virtual:playground-source-graph';
import type { ExampleMetadata } from '../../shared/types/playground';
import { HighlightedCode } from './HighlightedCode';
import { highlightSource } from './highlight';
import { exampleSourcePath } from './source-paths';
import { groupExampleSources, type SourcePolicy } from './source-groups';
import type { CodeLocation } from './code-location';

const allSources = import.meta.glob<string>('/src/**/*.{ts,tsx,css,json}', {
  query: '?raw',
  import: 'default',
});

function SourceGroupHeader({
  title,
  separator = false,
  pinnedRows = 0,
}: {
  readonly title: string;
  readonly separator?: boolean;
  readonly pinnedRows?: number;
}) {
  return (
    <ListSubheader
      role="presentation"
      sx={(theme) => {
        const tint = alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.16 : 0.08);
        return {
          bgcolor: 'background.paper',
          backgroundImage: `linear-gradient(${tint}, ${tint})`,
          backgroundSize: '100% 32px',
          backgroundPosition: separator ? '0 12px' : '0 0',
          backgroundRepeat: 'no-repeat',
          color: theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.info.dark,
          fontWeight: 600,
          lineHeight: '32px',
          pb: 0.75,
          zIndex: 2,
          top: separator ? { xs: 38 + pinnedRows * 48, sm: 38 + pinnedRows * 36 } : 0,
          ...(separator ? { borderTop: 1, borderColor: 'divider', pt: 1.5 } : {}),
        };
      }}
    >
      {title}
    </ListSubheader>
  );
}
SourceGroupHeader.muiSkipListHighlight = true;

export function CodeViewer({
  example,
  data,
  dataFormat = 'json',
  dataDescription,
  sourcePolicy,
  codeTarget,
  requestedCode = false,
}: {
  readonly example: ExampleMetadata;
  readonly data?: string;
  readonly dataFormat?: 'json' | 'jsonc';
  readonly dataDescription?: string;
  readonly sourcePolicy?: SourcePolicy;
  readonly codeTarget?: CodeLocation;
  readonly requestedCode?: boolean;
}) {
  const { t } = useOwpTranslation();
  const initialFile = `/src/${exampleSourcePath(example)}`;
  const groups = useMemo(
    () =>
      groupExampleSources({
        example,
        sources: Object.keys(allSources),
        dependencies,
        policy: sourcePolicy,
      }),
    [example, sourcePolicy],
  );
  const files = [...groups.core, ...groups.support];
  const targetFile =
    codeTarget &&
    codeTarget.file.startsWith(`playgrounds/${example.package.replace('@owp/', '')}/`) &&
    files.includes(`/src/${codeTarget.file}`)
      ? `/src/${codeTarget.file}`
      : undefined;
  const [file, setFile] = useState(targetFile ?? initialFile);
  const scroll = useRef<HTMLElement>(null);
  useEffect(() => {
    if (targetFile) setFile(targetFile);
  }, [targetFile, codeTarget?.line, codeTarget?.endLine]);
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
  const highlight = useMemo(
    () =>
      codeTarget &&
      file === targetFile &&
      codeTarget.line <= content.split('\n').length &&
      codeTarget.endLine <= content.split('\n').length
        ? { line: codeTarget.line, endLine: codeTarget.endLine }
        : undefined,
    [codeTarget, file, targetFile, content],
  );
  useEffect(() => {
    if (!ready || !highlight) return;
    scroll.current
      ?.querySelector('[data-highlighted="true"]')
      ?.scrollIntoView({ block: 'center', inline: 'nearest' });
    scroll.current?.focus({ preventScroll: true });
  }, [ready, file, highlight]);
  const highlighted = useMemo(
    () =>
      highlightSource(
        content,
        data !== undefined
          ? dataFormat
          : file.endsWith('.css')
            ? 'css'
            : file.endsWith('.json')
              ? 'json'
              : 'typescript',
      ),
    [content, data, dataFormat, file],
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setNotice('복사했습니다.');
    } catch (error) {
      if (error instanceof Error) setNotice('복사하지 못했습니다. 코드를 선택해 복사해 주세요.');
      else throw error;
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download =
      data !== undefined
        ? `${example.id}.${dataFormat}`
        : (file.split('/').at(-1) ?? 'example.tsx');
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const fileItems = (paths: readonly string[], pinned = false) =>
    paths.map((path, index) => (
      <MenuItem
        key={path}
        value={path}
        sx={
          pinned
            ? (theme) => {
                const blend = (color: string, opacity: number) =>
                  `color-mix(in srgb, ${color} ${opacity * 100}%, ${theme.palette.background.paper})`;
                const { action, primary } = theme.palette;
                return {
                  position: 'sticky',
                  top: { xs: 38 + index * 48, sm: 38 + index * 36 },
                  height: { xs: 48, sm: 36 },
                  minHeight: { xs: 48, sm: 36 },
                  zIndex: 1,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: blend(primary.main, action.hoverOpacity) },
                  '&.Mui-focusVisible': { bgcolor: blend(primary.main, action.focusOpacity) },
                  '&.Mui-selected': {
                    bgcolor: blend(primary.main, action.selectedOpacity),
                    '&:hover': {
                      bgcolor: blend(primary.main, action.selectedOpacity + action.hoverOpacity),
                    },
                    '&.Mui-focusVisible': {
                      bgcolor: blend(primary.main, action.selectedOpacity + action.focusOpacity),
                    },
                  },
                };
              }
            : undefined
        }
      >
        {files.filter((entry) => entry.split('/').at(-1) === path.split('/').at(-1)).length > 1
          ? path.replace('/src/', '')
          : path.split('/').at(-1)}
      </MenuItem>
    ));
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
              renderValue={(selected) => selected.split('/').at(-1)}
              onChange={(event) => {
                setFile(event.target.value);
                setCopied(false);
                setNotice('');
              }}
              inputProps={{ 'aria-label': t('소스 파일 선택') }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      scrollPaddingTop: {
                        xs: 38 + groups.core.length * 48 + 51,
                        sm: 38 + groups.core.length * 36 + 51,
                      },
                    },
                  },
                },
              }}
            >
              <SourceGroupHeader title={t('주요 구현')} />
              {fileItems(groups.core, true)}
              <SourceGroupHeader title={t('공통 코드')} separator pinnedRows={groups.core.length} />
              {fileItems(groups.support)}
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
      {data === undefined && <div className="code-file-path">{file.replace('/src/', '')}</div>}
      <section
        ref={scroll}
        className="code-scroll"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll the source region.
        tabIndex={0}
        aria-label={t(data !== undefined ? '데이터' : '실행 원본 코드')}
      >
        <pre>
          <HighlightedCode html={highlighted} highlight={highlight} />
        </pre>
      </section>
      <div className="code-status" role="status">
        {t(
          notice ||
            (!ready
              ? '소스를 불러오는 중…'
              : data !== undefined
                ? (dataDescription ?? '현재 예제에 사용된 API 데이터입니다.')
                : highlight
                  ? '연결된 API 사용 위치 강조'
                  : requestedCode && !codeTarget
                    ? '연결된 위치 정보가 없어 예제 진입 파일 표시'
                    : codeTarget && !highlight
                      ? '현재 파일에서 연결된 코드 위치를 찾지 못함'
                      : '실행에 사용한 원본 코드입니다.'),
        )}
      </div>
    </div>
  );
}
