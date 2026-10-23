import { useEffect } from 'react';
import { OwpTable } from '@owp/core';
import { useGetCurrentSettings, useSetSettings } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';

const rows = [
  { name: 'Item A', count: 12 },
  { name: 'Item B', count: 24 },
];

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const settings = useGetCurrentSettings();
  const setSettings = useSetSettings();
  const size = Number(settings.theme.main.table?.cell?.fontSize ?? 14);
  useEffect(() => {
    onData({ table: settings.theme.main.table });
  }, [settings, onData]);
  return (
    <CoreDemo
      controls={
        <CoreChoice
          label="글자 크기 (px)"
          value={size}
          options={[12, 14, 16]}
          onChange={(fontSize) => {
            const table = settings.theme.main.table;
            setSettings({
              ...settings,
              theme: {
                ...settings.theme,
                main: {
                  ...settings.theme.main,
                  table: {
                    ...table,
                    header: { ...table?.header, fontSize },
                    cell: { ...table?.cell, fontSize },
                  },
                },
              },
            });
            onRecord('settings.change', JSON.stringify({ fontSize }));
          }}
        />
      }
    >
      <DemoSection description="Core 설정을 변경하면 같은 store를 사용하는 테이블에 바로 반영됩니다.">
        <OwpTable
          aria-label={t('설정 미리보기')}
          headers={{ name: t('이름'), count: t('개수') }}
          rows={rows}
          size="small"
        />
      </DemoSection>
    </CoreDemo>
  );
}
