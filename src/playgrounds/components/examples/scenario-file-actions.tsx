import { OwpFilePickerButton, OwpMoreActionsButton, OwpSection, OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { Stack, Typography } from '@mui/material';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

type FileInfo = { readonly name: string; readonly size: number; readonly type: string };

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState<{ readonly files: readonly FileInfo[] }>(
    { files: [] },
    props,
  );
  return (
    <ExampleSection
      title="파일 선택과 목록 작업"
      description="선택한 파일의 이름·크기·형식을 표시하고 작업 메뉴에서 목록을 비웁니다. 파일 내용은 읽거나 전송하지 않습니다."
    >
      <OwpSection
        title={t('선택한 파일')}
        actions={
          <Stack direction="row" spacing={1}>
            <OwpFilePickerButton
              variant="outlined"
              tabIndex={0}
              multiple
              accept=".txt,.csv,.json"
              onChange={(event) =>
                change(
                  'files',
                  Array.from(event.target.files ?? [], (file) => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  })),
                )
              }
              onCancel={() => props.onRecord('files.cancel', 'cancelled')}
            >
              {t('파일 선택')}
            </OwpFilePickerButton>
            <OwpMoreActionsButton
              actions={[
                {
                  id: 'clear-file-list',
                  label: t('선택 목록 지우기'),
                  onClick: ({ close }) => {
                    change('files', []);
                    close();
                  },
                },
              ]}
            />
          </Stack>
        }
      >
        {values.files.length > 0 ? (
          <OwpTable
            aria-label={t('선택한 파일')}
            headers={{ name: t('파일 이름'), size: t('파일 크기 (bytes)'), type: t('파일 형식') }}
            rows={values.files.map((file) => ({ ...file, type: file.type || t('알 수 없음') }))}
            size="small"
            canTotalCountRow
            totalCount={values.files.length}
            containerProps={{ sx: { overflowX: 'auto' } }}
          />
        ) : (
          <Typography role="status">{t('선택한 파일이 없습니다.')}</Typography>
        )}
      </OwpSection>
    </ExampleSection>
  );
}
