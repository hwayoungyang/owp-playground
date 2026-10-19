import { useOwpTranslation } from '@owp/components/hooks';
import { Button, FormControlLabel, Switch } from '@mui/material';
import { useMemo, useState } from 'react';
import type { ExampleMetadata } from '../../shared/types/playground';
import { type ApiDataSource, formatApiData } from './api-data';
import { CodeViewer } from './CodeViewer';

export function ApiDataViewer({
  example,
  document,
}: {
  readonly example: ExampleMetadata;
  readonly document: ApiDataSource;
}) {
  const { t } = useOwpTranslation();
  const [comments, setComments] = useState(true);
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(document.totalRows / 100) - 1);
  const currentPage = Math.min(page, lastPage);
  const start = currentPage * 100;
  const end = Math.min(start + 100, document.totalRows);
  const data = useMemo(
    () => formatApiData({ fields: document.fields, rows: document.getRows(start, end) }, comments),
    [document, comments, start, end],
  );
  return (
    <>
      <div className="api-data-controls">
        <FormControlLabel
          control={
            <Switch size="small" checked={comments} onChange={(_, next) => setComments(next)} />
          }
          label={t('필드 설명 표시')}
        />
        <span>{t('OWP_DATA.DATA* 형식 · 숫자와 boolean은 문자열')}</span>
      </div>
      <section className="api-data-pagination" aria-label={t('데이터 표시 범위')}>
        <span>
          {t('{{start}}–{{end}} / 전체 {{total}}건', {
            total: document.totalRows,
            start: document.totalRows ? start + 1 : 0,
            end,
          })}
        </span>
        <Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
          {t('이전 100건')}
        </Button>
        <Button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>
          {t('다음 100건')}
        </Button>
      </section>
      <CodeViewer
        example={example}
        data={data}
        dataFormat={comments ? 'jsonc' : 'json'}
        dataDescription={
          comments
            ? '필드 설명을 끄면 JSON으로 복사하거나 다운로드할 수 있습니다.'
            : '현재 예제에 사용된 API 데이터입니다.'
        }
      />
    </>
  );
}
