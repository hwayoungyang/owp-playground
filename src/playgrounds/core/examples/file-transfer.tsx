import { useEffect, useState } from 'react';
import { Button, Typography } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { useFormDataUploadMutation } from '@owp/core/hooks';
import { normalizeFormDataUploadParams } from '@owp/core/utils';
import type { CoreExampleProps } from '../model/types';
import { describeFormData, sampleUploadText } from '../model/file-transfer';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';
import { CoreResultTable } from '../runtime/CoreResultTable';

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [fileNameMode, setFileNameMode] = useState<'기본값' | '페이지와 테이블' | '직접 지정'>(
    '기본값',
  );
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
    onData({ fileNameMode, normalizedKeys, payloadRows });
  }, [fileNameMode, normalizedKeys, payloadRows, onData]);

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
        title="업로드 payload 준비"
        description="샘플 File과 추가 필드를 정규화한 뒤, useFormDataUploadMutation이 만든 FormData를 표에 표시합니다. 이 예제의 mutation은 미리보기만 수행하며 서버에 파일을 전송하지 않습니다."
      >
        <Typography variant="body2" color="text.secondary">
          {t(
            '실제 업로드는 mutation을 앱의 API mutation으로 교체하고, createVariables에서 formData를 해당 API의 요청 변수에 연결합니다.',
          )}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const params = {
              file: new File([sampleUploadText], 'sample.txt', { type: 'text/plain' }),
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
          {t('payload 미리보기')}
        </Button>
        <CoreResultTable
          headers={{ field: t('필드'), value: t('값') }}
          rows={payloadRows}
          state={
            payloadRows.length
              ? undefined
              : { kind: 'idle', message: t('payload 미리보기 버튼을 눌러 주세요.') }
          }
        />
        <Typography variant="body2" color="text.secondary">
          {t(
            '기본 파일명 필드는 FILE_NAME입니다. PAGEID·TABLENAME을 함께 전달하면 ITEM_ATTACHMENT가 되고, 직접 지정하면 ORIGINAL_NAME을 사용합니다.',
          )}
        </Typography>
      </DemoSection>
    </CoreDemo>
  );
}
