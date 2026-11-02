import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useOwpTranslation } from '@owp/components/hooks';
import { mergeSx } from '@owp/components/utils';
import { ExampleResult } from './components/hook-observation';
import type { ComponentsExampleProps } from '../model/types';
import { ExampleSection } from '../runtime/ExampleSection';

const base = {
  p: 2,
  bgcolor: 'background.paper',
  color: 'text.primary',
  border: 1,
  borderColor: 'divider',
} as const;
const emphasis = { fontWeight: 600, bgcolor: 'action.selected' } as const;
export function ComponentsExample({ onData }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  useEffect(() => {
    onData({
      base: mergeSx(base),
      forward: mergeSx(base, emphasis),
      reverse: mergeSx(emphasis, base),
      optional: mergeSx(base, false, undefined, [emphasis]),
    });
  }, [onData]);
  return (
    <>
      <ExampleSection
        title="sx 객체 하나"
        description="기본 sx 객체를 배열 형태로 반환하며 MUI의 sx에 그대로 전달합니다."
      >
        <Box sx={mergeSx(base)}>{t('기본 스타일')}</Box>
        <ExampleResult value={mergeSx(base)} />
      </ExampleSection>
      <ExampleSection
        title="전달 순서에 따른 덮어쓰기"
        description="뒤에 전달한 sx가 앞의 값을 덮어씁니다. 두 영역의 배경을 비교하세요."
      >
        <div className="components-example-grid">
          <Box sx={mergeSx(base, emphasis)}>{t('강조 스타일이 나중')}</Box>
          <Box sx={mergeSx(emphasis, base)}>{t('기본 스타일이 나중')}</Box>
        </div>
      </ExampleSection>
      <ExampleSection
        title="배열과 생략한 조건"
        description="false와 undefined는 제외합니다. sx 배열은 한 단계 펼쳐 전달 순서를 유지합니다."
      >
        <Box sx={mergeSx(base, false, undefined, [emphasis])}>{t('배열로 전달한 강조 스타일')}</Box>
        <ExampleResult value={mergeSx(base, false, undefined, [emphasis])} />
      </ExampleSection>
    </>
  );
}
