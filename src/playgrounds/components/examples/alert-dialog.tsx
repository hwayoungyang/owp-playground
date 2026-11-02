import { Button } from '@mui/material';
import { OwpAlertDialog } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState<
    Record<
      'choice' | 'notice' | 'warning',
      { readonly open: boolean; readonly result: boolean | null }
    >
  >(
    {
      choice: { open: false, result: null },
      notice: { open: false, result: null },
      warning: { open: false, result: null },
    },
    props,
  );
  return (
    <>
      <ExampleSection
        title="확인과 취소"
        description="확인·취소 결과를 각각 true·false로 받습니다."
      >
        <Button variant="outlined" onClick={() => change('choice', { open: true, result: null })}>
          {t('선택 확인창 열기')}
        </Button>
        <OwpAlertDialog
          open={values.choice.open}
          payload={{
            title: t('확인과 취소'),
            description: t('이 창의 버튼을 누르면 응답을 Data에 기록합니다.'),
            okText: t('선택 완료'),
            cancelText: t('취소'),
          }}
          onClose={(result) => change('choice', { open: false, result })}
        />
      </ExampleSection>
      <ExampleSection
        title="취소 버튼 없는 안내"
        description="hideCancelButton으로 확인 버튼만 표시합니다."
      >
        <Button variant="outlined" onClick={() => change('notice', { open: true, result: null })}>
          {t('안내창 열기')}
        </Button>
        <OwpAlertDialog
          open={values.notice.open}
          payload={{
            title: t('취소 버튼 없는 안내'),
            description: t('이 창의 버튼을 누르면 응답을 Data에 기록합니다.'),
            okText: t('읽음'),
            cancelText: t('취소'),
            hideCancelButton: true,
          }}
          onClose={(result) => change('notice', { open: false, result })}
        />
      </ExampleSection>
      <ExampleSection
        title="경고 색상 확인 버튼"
        description="confirmButtonColor와 okButtonProps로 확인 버튼을 지정합니다."
      >
        <Button variant="outlined" onClick={() => change('warning', { open: true, result: null })}>
          {t('삭제 확인창 열기')}
        </Button>
        <OwpAlertDialog
          open={values.warning.open}
          payload={{
            title: t('경고 색상 확인 버튼'),
            description: t('이 창의 버튼을 누르면 응답을 Data에 기록합니다.'),
            okText: t('항목 삭제'),
            cancelText: t('취소'),
            confirmButtonColor: 'warning',
            okButtonProps: { variant: 'contained' },
          }}
          onClose={(result) => change('warning', { open: false, result })}
        />
      </ExampleSection>
    </>
  );
}
