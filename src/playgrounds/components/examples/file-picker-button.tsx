import { OwpFilePickerButton } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

type FileMetadata = { readonly name: string; readonly size: number; readonly type: string };
export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [, change] = useComponentExampleState<
    Record<'single' | 'images' | 'disabled', readonly FileMetadata[]>
  >({ single: [], images: [], disabled: [] }, props);
  return (
    <>
      <ExampleSection
        title="파일 하나 선택"
        description="accept로 텍스트 파일 확장자를 지정하고 한 파일만 선택합니다."
      >
        <OwpFilePickerButton
          variant="outlined"
          tabIndex={0}
          accept=".txt,.csv,.json"
          onChange={(event) =>
            change(
              'single',
              Array.from(event.target.files ?? []).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            )
          }
          onCancel={() => props.onRecord('single.cancel', t('파일 선택을 취소했습니다.'))}
        >
          {t('파일 선택')}
        </OwpFilePickerButton>
      </ExampleSection>
      <ExampleSection
        title="여러 이미지 선택"
        description="multiple과 image MIME 조건으로 이미지 여러 개를 선택합니다."
      >
        <OwpFilePickerButton
          variant="outlined"
          tabIndex={0}
          multiple
          accept="image/*"
          onChange={(event) =>
            change(
              'images',
              Array.from(event.target.files ?? []).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            )
          }
          onCancel={() => props.onRecord('images.cancel', t('파일 선택을 취소했습니다.'))}
        >
          {t('파일 선택')}
        </OwpFilePickerButton>
      </ExampleSection>
      <ExampleSection
        title="선택 버튼 비활성화"
        description="disabled 버튼은 파일 선택창을 열지 않습니다."
      >
        <OwpFilePickerButton
          variant="outlined"
          tabIndex={0}
          disabled
          accept=".txt"
          onChange={(event) =>
            change(
              'disabled',
              Array.from(event.target.files ?? []).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            )
          }
          onCancel={() => props.onRecord('disabled.cancel', t('파일 선택을 취소했습니다.'))}
        >
          {t('파일 선택')}
        </OwpFilePickerButton>
      </ExampleSection>
    </>
  );
}
