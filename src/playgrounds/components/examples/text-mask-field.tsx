import { OwpTextMaskField } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';
import { useComponentExampleState } from './components/component-state';

export function ComponentsExample(props: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [values, change] = useComponentExampleState(
    {
      phone: { value: '010-1234-5678', unmaskedValue: '01012345678' },
      code: { value: 'AB-1234', unmaskedValue: 'AB1234' },
      pin: { value: '12', unmaskedValue: '12' },
    },
    props,
  );
  return (
    <>
      <ExampleSection title="연락처 mask" description="숫자 11자리를 연락처 형식으로 입력합니다.">
        <div className="components-example-grid">
          <OwpTextMaskField
            fullWidth
            size="small"
            label={t('연락처')}
            value={values.phone.value}
            mask="000-0000-0000"
            placeholder="010-1234-5678"
            onChange={(event) =>
              change('phone', { value: event.target.value, unmaskedValue: event.unmaskedValue })
            }
            onInvalidInput={() =>
              props.onRecord('phone.invalid', t('mask에 맞지 않는 문자를 입력했습니다.'))
            }
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="문자와 숫자 mask"
        description="definitions의 A는 영문 대문자만 허용하고 0은 숫자를 받습니다."
      >
        <div className="components-example-grid">
          <OwpTextMaskField
            fullWidth
            size="small"
            label={t('항목 코드')}
            value={values.code.value}
            mask="AA-0000"
            definitions={{ A: /[A-Z]/ }}
            placeholder="AB-1234"
            onChange={(event) =>
              change('code', { value: event.target.value, unmaskedValue: event.unmaskedValue })
            }
            onInvalidInput={() =>
              props.onRecord('code.invalid', t('mask에 맞지 않는 문자를 입력했습니다.'))
            }
          />
        </div>
      </ExampleSection>
      <ExampleSection
        title="입력 오류 안내"
        description="네 자리보다 짧은 코드에는 오류를 표시합니다."
      >
        <div className="components-example-grid">
          <OwpTextMaskField
            fullWidth
            size="small"
            label={t('네 자리 코드')}
            value={values.pin.value}
            mask="0000"
            error={values.pin.unmaskedValue.length !== 4}
            helperText={
              values.pin.unmaskedValue.length !== 4
                ? t('코드 네 자리를 입력해 주세요.')
                : t('코드 네 자리를 입력했습니다.')
            }
            onChange={(event) =>
              change('pin', { value: event.target.value, unmaskedValue: event.unmaskedValue })
            }
            onInvalidInput={() =>
              props.onRecord('pin.invalid', t('mask에 맞지 않는 문자를 입력했습니다.'))
            }
          />
        </div>
      </ExampleSection>
    </>
  );
}
