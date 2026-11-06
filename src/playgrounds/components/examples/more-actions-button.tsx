import { Button, Stack } from '@mui/material';
import { OwpMoreActionsButton } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState<{
    readonly basic: string;
    readonly controlledOpen: boolean;
    readonly controlledAction: string;
    readonly files: readonly { readonly name: string; readonly size: number }[];
  }>({ basic: '', controlledOpen: false, controlledAction: '', files: [] }, props);
  return (
    <>
      <ExampleSection
        title="기본 작업 메뉴"
        description="컴포넌트가 메뉴 열림을 관리하고 클릭한 작업에서 메뉴를 닫습니다."
      >
        <OwpMoreActionsButton
          buttonSx={{ color: 'primary.main' }}
          menuSx={{ minWidth: 180 }}
          actions={[
            {
              id: 'view-detail',
              label: t('상세 보기'),
              onClick: ({ close }) => {
                change('basic', 'detail');
                close();
              },
            },
            {
              id: 'clear-selection',
              label: t('선택 초기화'),
              onClick: ({ close }) => {
                change('basic', 'clear');
                close();
              },
            },
          ]}
        />
      </ExampleSection>
      <ExampleSection
        title="외부에서 여닫는 메뉴"
        description="별도 버튼과 open·onOpenChange로 메뉴 열림을 제어합니다."
      >
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={() => change('controlledOpen', !values.controlledOpen)}
          >
            {t('작업 메뉴 열기')}
          </Button>
          <OwpMoreActionsButton
            open={values.controlledOpen}
            onOpenChange={(open) => change('controlledOpen', open)}
            actions={[
              {
                id: 'record-selection',
                label: t('선택 기록'),
                onClick: ({ close }) => {
                  change('controlledAction', 'selected');
                  close();
                },
              },
            ]}
          />
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="파일 선택 작업"
        description="type이 fileUpload인 메뉴 항목에서 파일 정보를 받습니다."
      >
        <OwpMoreActionsButton
          actions={[
            {
              id: 'upload-text-files',
              type: 'fileUpload',
              label: t('텍스트 파일 선택'),
              fileUploadProps: {
                accept: '.txt,.csv',
                multiple: true,
                onChange: (event) =>
                  change(
                    'files',
                    Array.from(event.target.files ?? []).map((file) => ({
                      name: file.name,
                      size: file.size,
                    })),
                  ),
              },
            },
          ]}
        />
      </ExampleSection>
    </>
  );
}
