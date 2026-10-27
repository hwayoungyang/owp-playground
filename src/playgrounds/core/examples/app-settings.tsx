import { useEffect } from 'react';
import { Button } from '@mui/material';
import { OwpFieldTable, OwpTable } from '@owp/components';
import {
  useChangeOwpTheme,
  useGetCurrentSettings,
  useGetDefaultSettings,
  useResetSettings,
  useSetSettings,
  useStorage,
} from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import { summarizeStoredEnv } from '../model/policy';
import type { CoreExampleProps } from '../model/types';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice } from '../runtime/Controls';

const rows = [
  { name: 'Item A', count: 12 },
  { name: 'Item B', count: 24 },
];
const themePresets = ['기본 테마', '강조 헤더'] as const;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t } = useOwpTranslation();
  const settings = useGetCurrentSettings();
  const defaultSettings = useGetDefaultSettings();
  const setSettings = useSetSettings();
  const changeOwpTheme = useChangeOwpTheme();
  const resetSettings = useResetSettings();
  const { getEnv } = useStorage();
  const preset =
    defaultSettings.theme.main.table?.header?.fontSize === 16 ? '강조 헤더' : '기본 테마';
  const size = Number(settings.theme.main.table?.cell?.fontSize ?? 14);
  const defaultSize = Number(defaultSettings.theme.main.table?.cell?.fontSize ?? 14);
  const { keyCount: envKeyCount, hasApiBaseUrl } = summarizeStoredEnv(getEnv());

  useEffect(() => {
    onData({
      table: settings.theme.main.table,
      defaultTable: defaultSettings.theme.main.table,
      preset,
      storageEnvSummary: {
        keyCount: envKeyCount,
        hasApiBaseUrl,
      },
    });
  }, [
    defaultSettings.theme.main.table,
    envKeyCount,
    hasApiBaseUrl,
    onData,
    preset,
    settings.theme.main.table,
  ]);
  return (
    <CoreDemo
      controls={
        <>
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
          <CoreChoice
            label="테마 구성"
            value={preset}
            options={themePresets}
            onChange={(nextPreset) => {
              const table = settings.theme.main.table;
              const headerFontSize = nextPreset === '강조 헤더' ? 16 : 14;
              changeOwpTheme({
                ...settings.theme,
                main: {
                  ...settings.theme.main,
                  table: {
                    ...table,
                    header: { ...table?.header, fontSize: headerFontSize },
                  },
                },
              });
              onRecord('theme.change', nextPreset);
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              resetSettings();
              onRecord('settings.reset', 'defaults');
            }}
          >
            {t('현재 설정 초기화')}
          </Button>
        </>
      }
    >
      <DemoSection description="useSetSettings는 현재 설정을, useChangeOwpTheme는 기본·현재 테마를 메모리 store에서 갱신합니다. 설정 저장은 소비앱의 책임이며 useStorage는 앱 환경 조회·저장과 storage 초기화를 제공합니다.">
        <OwpTable
          aria-label={t('설정 미리보기')}
          headers={{ name: t('이름'), count: t('개수') }}
          rows={rows}
          size="small"
        />
        <OwpFieldTable
          layout={[
            [
              { title: t('현재 글자 크기'), key: 'currentFontSize' },
              { title: t('기본 헤더 크기'), key: 'defaultHeaderSize' },
            ],
            [
              { title: t('테마 구성'), key: 'preset' },
              { title: t('저장소 경계'), key: 'storageBoundary' },
            ],
          ]}
          data={{
            currentFontSize: `${size}px (default ${defaultSize}px)`,
            defaultHeaderSize: `${Number(defaultSettings.theme.main.table?.header?.fontSize ?? 14)}px`,
            preset: t(preset),
            storageBoundary: t('메모리 Jotai 상태 (자동 저장 없음)'),
          }}
          titleWidth={140}
        />
      </DemoSection>
    </CoreDemo>
  );
}
