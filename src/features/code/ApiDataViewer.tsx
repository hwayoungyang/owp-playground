import { Button, FormControlLabel, Switch } from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('app');
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
          label={t('필드 설명 주석')}
        />
        <span>
          {t(
            'OWP_DATA.DATA* 형식의 가상 API 데이터입니다. 숫자와 boolean 값은 문자열로 전달합니다.',
          )}
        </span>
      </div>
      <section className="api-data-pagination" aria-label={t('데이터 표시 범위')}>
        <span>
          {t('전체 {{total}}개 중 {{start}}–{{end}}번째 데이터', {
            total: document.totalRows,
            start: document.totalRows ? start + 1 : 0,
            end,
          })}
        </span>
        <Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
          {t('이전 100개')}
        </Button>
        <Button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>
          {t('다음 100개')}
        </Button>
      </section>
      <CodeViewer
        example={example}
        data={data}
        dataFormat={comments ? 'jsonc' : 'json'}
        dataDescription={
          comments
            ? '필드와 참조 관계를 설명한 JSONC입니다. 주석을 끄면 JSON으로 복사·다운로드할 수 있습니다.'
            : '현재 화면에 적용된 가상 API 데이터입니다.'
        }
      />
    </>
  );
}
