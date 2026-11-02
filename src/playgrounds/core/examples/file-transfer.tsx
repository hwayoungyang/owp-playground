import { useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { OwpFilePickerButton } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { useFormDataUploadMutation } from '@owp/core/hooks';
import { normalizeFormDataUploadParams } from '@owp/core/utils';
import type { CoreExampleProps } from '../model/types';
import { describeFormData } from '../model/file-transfer';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';
import { CoreResultTable } from '../runtime/CoreResultTable';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [fileNameMode, setFileNameMode] = useState<'기본값' | '페이지와 테이블' | '직접 지정'>(
    '기본값',
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [payloadRows, setPayloadRows] = useState<ReturnType<typeof describeFormData>>([]);
  const [normalizedKeys, setNormalizedKeys] = useState<string[]>([]);
  const fileNameFieldName = fileNameMode === '직접 지정' ? 'ORIGINAL_NAME' : undefined;
  const upload = useFormDataUploadMutation({
    fileNameFieldName,
    mutation: {
      mutate: ({ body }: { readonly body: FormData }) => {
        const rows = describeFormData(body);
        setPayloadRows(rows);
        onRecord('upload.payload.preview', JSON.stringify(rows));
      },
    },
    createVariables: ({ formData }) => ({ body: formData }),
  });

  useEffect(() => {
    onData({
      selectedFile: selectedFile
        ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type }
        : null,
      fileNameMode,
      normalizedKeys,
      payloadRows,
    });
  }, [selectedFile, fileNameMode, normalizedKeys, payloadRows, onData]);

  return (
    <CoreDemo
      controls={
        <CoreChoice
          label="파일명 필드"
          value={fileNameMode}
          options={['기본값', '페이지와 테이블', '직접 지정'] as const}
          onChange={(value) => {
            setFileNameMode(value);
            setPayloadRows([]);
            setNormalizedKeys([]);
          }}
        />
      }
    >
      <DemoSection
        title="파일 선택과 요청 미리보기"
        description="로컬 파일 하나를 선택하고 추가하면 업로드 요청의 FormData를 확인할 수 있습니다. 요청은 로컬에서만 미리 보며 서버에 전송하지 않습니다."
      >
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <OwpFilePickerButton
            variant="outlined"
            tabIndex={0}
            accept=""
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setSelectedFile(file);
              setPayloadRows([]);
              setNormalizedKeys([]);
              onRecord(
                'upload.file.select',
                JSON.stringify({ name: file.name, size: file.size, type: file.type }),
              );
            }}
            onCancel={() => onRecord('upload.file.cancel', t('파일 선택을 취소했습니다.'))}
          >
            {t('파일 선택')}
          </OwpFilePickerButton>
          <Button
            variant="contained"
            disabled={!selectedFile}
            onClick={() => {
              if (!selectedFile) return;
              const params = {
                file: selectedFile,
                category: 'DEMO',
                ...(fileNameMode === '페이지와 테이블'
                  ? { PAGEID: 'ITEM', TABLENAME: 'ATTACHMENT' }
                  : {}),
              };
              const normalized = normalizeFormDataUploadParams(params, { fileNameFieldName });
              setNormalizedKeys(Object.keys(normalized));
              upload.uploadFile(params);
            }}
          >
            {t('파일 추가')}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {selectedFile
            ? t('선택한 파일: {{name}} · {{size}}바이트 · MIME: {{type}}', {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type || t('알 수 없음'),
              })
            : t('선택한 파일이 없습니다. 파일 선택 버튼으로 로컬 파일을 선택해 주세요.')}
        </Typography>
        {payloadRows.length > 0 && (
          <Typography variant="body2" role="status" aria-live="polite">
            {t('파일을 추가했습니다. 아래 표에서 FormData에 담긴 필드를 확인하세요.')}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {t(
            'file에는 선택한 파일의 바이너리가 담깁니다. 표에는 파일 내용 대신 이름·크기·MIME을 표시하며, 나머지 행은 함께 전달되는 파일명과 추가 필드입니다.',
          )}
        </Typography>
        <CoreResultTable
          headers={{ field: t('필드'), value: t('값') }}
          rows={payloadRows}
          state={
            payloadRows.length
              ? undefined
              : {
                  kind: 'idle',
                  message: selectedFile
                    ? t('추가 버튼을 눌러 선택한 파일의 FormData를 확인하세요.')
                    : t('파일을 선택한 뒤 추가 버튼을 눌러 주세요.'),
                }
          }
        />
        <Typography variant="body2" color="text.secondary">
          {t(
            '기본 파일명 필드는 FILE_NAME입니다. PAGEID·TABLENAME을 함께 전달하면 ITEM_ATTACHMENT가 되고, 직접 지정하면 ORIGINAL_NAME을 사용합니다.',
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.',
          )}
        </Typography>
      </DemoSection>
    </CoreDemo>
  );
}
