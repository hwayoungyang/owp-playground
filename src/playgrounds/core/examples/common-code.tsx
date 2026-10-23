import { useEffect, useMemo, useState } from 'react';
import { Alert } from '@mui/material';
import { OwpCommonCodeRadioGroup, OwpCommonCodeSelector } from '@owp/core';
import { OwpStoreProvider } from '@owp/core/contexts';
import { STORAGE_KEYS } from '@owp/core/constants';
import { useGetCommonCodeList, useSetCommonCodeList } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { commonCodeGroup, queryFixture } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';

const selectorOptions = ['Select', 'RadioGroup'] as const;

function CommonCodeDemo({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const setCodes = useSetCommonCodeList();
  const codes = useGetCommonCodeList();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [value, setValue] = useState('A');
  const [selector, setSelector] = useState<(typeof selectorOptions)[number]>('Select');
  const [activeOnly, setActiveOnly] = useState(false);
  const fixture = useMemo(
    () =>
      queryFixture.resultData.map(
        (row) =>
          ({
            'IPX_COMMONCODE.CODEID': row.id,
            'IPX_COMMONCODE.CODENM': i18n.language === 'en' ? row.nameEn : row.nameKo,
            'IPX_COMMONCODE.GROUPID': commonCodeGroup,
            'IPX_COMMONCODE.GROUPNM': 'Playground items',
            'IPX_COMMONCODE.FLAG': row.active ? 'Y' : 'N',
            'IPX_COMMONCODE.WDATE': '2026-10-24T00:00:00Z',
            'IPX_COMMONCODE.REMARK': 'Local Playground fixture',
            'IPX_COMMONCODE.DESCRIPTION': row.active ? 'active' : 'inactive',
          }) satisfies ReturnType<typeof useGetCommonCodeList>[string][number],
      ),
    [i18n.language],
  );

  useEffect(() => {
    try {
      const storage = window.sessionStorage;
      const previous = storage.getItem(STORAGE_KEYS.commonCodeList);
      try {
        setCodes({ [commonCodeGroup]: fixture });
      } finally {
        if (previous === null) storage.removeItem(STORAGE_KEYS.commonCodeList);
        else storage.setItem(STORAGE_KEYS.commonCodeList, previous);
      }
      setStatus('ready');
    } catch (error) {
      if (!(error instanceof DOMException)) throw error;
      setStatus('error');
    }
  }, [fixture, setCodes]);

  useEffect(() => {
    onData({
      groupId: commonCodeGroup,
      status,
      value,
      selector,
      activeOnly,
      commonCodeList: codes?.[commonCodeGroup] ?? [],
    });
  }, [activeOnly, codes, onData, selector, status, value]);

  const filter: NonNullable<Parameters<typeof OwpCommonCodeSelector>[0]['filterOptions']> = (row) =>
    !activeOnly || row['IPX_COMMONCODE.FLAG'] === 'Y';

  if (status !== 'ready')
    return (
      <Alert severity={status === 'error' ? 'error' : 'info'} role="status">
        {status === 'error'
          ? t('저장소에 접근할 수 없어 로컬 공통코드를 준비하지 못했습니다.')
          : t('로컬 공통코드를 준비하고 있습니다.')}
      </Alert>
    );

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="선택 방식"
            value={selector}
            options={selectorOptions}
            onChange={setSelector}
          />
          <CoreToggle
            label="사용 중인 항목만"
            value={activeOnly}
            onChange={(next) => {
              setActiveOnly(next);
              setValue('A');
              onRecord('commonCode.filter', String(next));
            }}
          />
        </>
      }
    >
      <DemoSection>
        <div className="core-field">
          {selector === 'Select' ? (
            <OwpCommonCodeSelector
              groupId={commonCodeGroup}
              label={t('이름')}
              value={value}
              fullWidth
              variant="outlined"
              size="small"
              showAllOption={false}
              filterOptions={filter}
              onChange={(event) => {
                setValue(event.target.value);
                onRecord('commonCode.select', event.target.value);
              }}
            />
          ) : (
            <OwpCommonCodeRadioGroup
              groupId={commonCodeGroup}
              label={t('이름')}
              value={value}
              filterOptions={filter}
              onChange={(event) => {
                if (event.target instanceof HTMLInputElement) {
                  setValue(event.target.value);
                  onRecord('commonCode.radio', event.target.value);
                }
              }}
            />
          )}
        </div>
      </DemoSection>
    </CoreDemo>
  );
}

export function CoreExample(props: CoreExampleProps) {
  return (
    <OwpStoreProvider>
      <CommonCodeDemo {...props} />
    </OwpStoreProvider>
  );
}
