import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { sanitizePasswordValue, sanitizeUserIdValue } from '@owp/core/utils';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreResultTable } from '../runtime/CoreResultTable';

export function CoreExample({ onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const [input, setInput] = useState('sample 사용자 01!');
  const userId = sanitizeUserIdValue(input);
  const password = sanitizePasswordValue(input);
  useEffect(() => {
    onData({ input, userId, password });
  }, [input, userId, password, onData]);
  return (
    <CoreDemo>
      <DemoSection description="아이디는 공백과 한글을 제거하고, 비밀번호는 영문·숫자·허용된 특수문자를 남깁니다. 입력값 정리와 인증·비밀번호 정책 검증은 별개입니다.">
        <TextField
          label={t('비교할 샘플 문자열')}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          size="small"
          fullWidth
        />
        <CoreResultTable
          headers={{ api: 'API', result: t('변환 결과') }}
          rows={[
            { api: 'sanitizeUserIdValue', result: userId || '—' },
            { api: 'sanitizePasswordValue', result: password || '—' },
          ]}
        />
      </DemoSection>
    </CoreDemo>
  );
}
