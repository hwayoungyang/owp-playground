import { Button, TextField } from '@mui/material';
import { OwpDialog } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      edit: { open: false, draft: '', saved: '' },
      form: { open: false, draft: '', saved: '' },
      maximized: { open: false, draft: '', saved: '' },
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="기본 편집 다이얼로그"
        description="onConfirm으로 입력값을 저장하고 창을 닫습니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('edit', { ...values.edit, draft: values.edit.saved, open: true })}
        >
          {t('기본 편집 창 열기')}
        </Button>
        <OwpDialog
          open={values.edit.open}
          title={t('기본 편집 다이얼로그')}
          confirmText={t('저장')}
          cancelText={t('닫기')}
          maxWidth="sm"
          fullWidth
          onClose={() => change('edit', { ...values.edit, open: false })}
          onCancel={() => change('edit', { ...values.edit, open: false })}
          onConfirm={() =>
            change('edit', { ...values.edit, saved: values.edit.draft, open: false })
          }
        >
          <TextField
            fullWidth
            autoFocus
            size="small"
            sx={{ mt: 1, maxWidth: 320 }}
            label={t('항목명')}
            value={values.edit.draft}
            onChange={(event) => change('edit', { ...values.edit, draft: event.target.value })}
          />
        </OwpDialog>
      </ExampleSection>
      <ExampleSection
        title="Enter로 제출하는 다이얼로그"
        description="submitOnConfirm과 onSubmit으로 Enter와 저장 버튼을 같은 제출 동작에 연결합니다."
      >
        <Button
          variant="outlined"
          onClick={() => change('form', { ...values.form, draft: values.form.saved, open: true })}
        >
          {t('form 편집 창 열기')}
        </Button>
        <OwpDialog
          open={values.form.open}
          title={t('Enter로 제출하는 다이얼로그')}
          confirmText={t('저장')}
          cancelText={t('닫기')}
          submitOnConfirm
          maxWidth="sm"
          fullWidth
          onClose={() => change('form', { ...values.form, open: false })}
          onCancel={() => change('form', { ...values.form, open: false })}
          onSubmit={(event) => {
            event.preventDefault();
            change('form', { ...values.form, saved: values.form.draft, open: false });
          }}
        >
          <TextField
            fullWidth
            autoFocus
            size="small"
            sx={{ mt: 1, maxWidth: 320 }}
            label={t('항목명')}
            value={values.form.draft}
            onChange={(event) => change('form', { ...values.form, draft: event.target.value })}
          />
        </OwpDialog>
      </ExampleSection>
      <ExampleSection
        title="넓게 여는 다이얼로그"
        description="maximized로 viewport 안의 가용 공간을 사용하고 보조 작업을 추가합니다."
      >
        <Button
          variant="outlined"
          onClick={() =>
            change('maximized', { ...values.maximized, draft: values.maximized.saved, open: true })
          }
        >
          {t('최대 크기 편집 창 열기')}
        </Button>
        <OwpDialog
          open={values.maximized.open}
          title={t('넓게 여는 다이얼로그')}
          confirmText={t('저장')}
          cancelText={t('닫기')}
          maximized
          actions={
            <Button onClick={() => change('maximized', { ...values.maximized, draft: '' })}>
              {' '}
              {t('입력 비우기')}{' '}
            </Button>
          }
          onClose={() => change('maximized', { ...values.maximized, open: false })}
          onCancel={() => change('maximized', { ...values.maximized, open: false })}
          onConfirm={() =>
            change('maximized', { ...values.maximized, saved: values.maximized.draft, open: false })
          }
        >
          <TextField
            fullWidth
            autoFocus
            size="small"
            sx={{ mt: 1, maxWidth: 320 }}
            label={t('항목명')}
            value={values.maximized.draft}
            onChange={(event) =>
              change('maximized', { ...values.maximized, draft: event.target.value })
            }
          />
        </OwpDialog>
      </ExampleSection>
    </>
  );
}
