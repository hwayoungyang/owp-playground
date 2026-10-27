import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { saveZipFile } from '@owp/utils/zip';
import type { CoreExampleProps } from '../model/types';
import { sampleArchiveFiles } from '../model/file-transfer';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreResultTable } from '../runtime/CoreResultTable';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [zipRequested, setZipRequested] = useState(false);
  const [zipPending, setZipPending] = useState(false);
  const [zipError, setZipError] = useState(false);

  useEffect(() => {
    onData({ zipRequested, zipPending, zipError });
  }, [zipRequested, zipPending, zipError, onData]);

  return (
    <CoreDemo>
      <DemoSection description="로컬 텍스트 두 개를 Blob으로 만들고 saveZipFile로 core-files.zip을 다운로드합니다. 파일명은 items.csv·readme.txt로 유지하며, 저장 여부는 브라우저 다운로드 목록에서 확인합니다.">
        <Button
          variant="outlined"
          loading={zipPending}
          onClick={async () => {
            setZipPending(true);
            setZipError(false);
            onRecord('zip.download.request', 'core-files.zip');
            try {
              await saveZipFile(
                sampleArchiveFiles.map(({ fileName, content, type }) => ({
                  fileName,
                  blob: new Blob([content], { type }),
                })),
                'core-files.zip',
              );
              setZipRequested(true);
            } catch (error) {
              setZipError(true);
              onRecord(
                'zip.download.error',
                error instanceof Error ? error.message : String(error),
              );
            } finally {
              setZipPending(false);
            }
          }}
        >
          {t('ZIP 다운로드')}
        </Button>
        <CoreResultTable
          headers={{ file: t('파일명'), content: t('파일 내용') }}
          rows={
            zipRequested
              ? sampleArchiveFiles.map(({ fileName, content }) => ({ file: fileName, content }))
              : []
          }
          state={
            zipPending
              ? { kind: 'loading', message: t('ZIP 파일을 만들고 있습니다.') }
              : zipError
                ? { kind: 'error', message: t('ZIP 파일을 만들지 못했습니다. 다시 시도해 주세요.') }
                : zipRequested
                  ? undefined
                  : { kind: 'idle', message: t('ZIP 다운로드 버튼을 눌러 주세요.') }
          }
        />
      </DemoSection>
    </CoreDemo>
  );
}
