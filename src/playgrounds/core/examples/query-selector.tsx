import { useEffect, useState } from 'react';
import { Alert, OutlinedInput } from '@mui/material';
import { OwpQuerySelector } from '@owp/core';
import { useQueryClient } from '@owp/core/hooks';
import { useOwpTranslation } from '@owp/components/hooks';
import type { CoreExampleProps } from '../model/types';
import { queryFixtures, type QueryFixtureItem } from '../model/fixtures';
import { CoreDemo, DemoSection } from '../runtime/Demo';
import { CoreChoice, CoreToggle } from '../runtime/Controls';
import itemsUrl from '../data/processes.json?url&no-inline';
import emptyItemsUrl from '../data/processes-empty.json?url&no-inline';
import failedItemsUrl from '../data/processes-error.json?url&no-inline';

const responses = {
  '정상 응답': { url: itemsUrl, fixture: queryFixtures.rows },
  '빈 응답': { url: emptyItemsUrl, fixture: queryFixtures.empty },
  '실패 응답': { url: failedItemsUrl, fixture: queryFixtures.error },
} as const;
const responseOptions = ['정상 응답', '빈 응답', '실패 응답'] as const;
const selectorOptions = ['Select', 'Autocomplete'] as const;

export function CoreExample({ onRecord, onData }: CoreExampleProps) {
  const { t, i18n } = useOwpTranslation();
  const client = useQueryClient();
  const [response, setResponse] = useState<(typeof responseOptions)[number]>('정상 응답');
  const [selector, setSelector] = useState<(typeof selectorOptions)[number]>('Select');
  const [activeOnly, setActiveOnly] = useState(false);
  const [value, setValue] = useState('');
  const [requestState, setRequestState] = useState<Readonly<Record<string, unknown>>>({});
  const apiUrl = new URL(responses[response].url, window.location.href).href;

  useEffect(() => {
    setRequestState({ status: 'pending' });
    return client.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || !event.query.queryKey.includes(apiUrl)) return;
      const state = event.query.state;
      setRequestState({
        status: state.status,
        fetchStatus: state.fetchStatus,
        options: state.data,
        error: state.error instanceof Error ? state.error.message : null,
      });
      if (event.action.type === 'success' || event.action.type === 'error') {
        onRecord(`query.${event.action.type}`, JSON.stringify({ apiUrl, status: state.status }));
      }
    });
  }, [apiUrl, client, onRecord]);

  useEffect(() => {
    onData({
      apiUrl,
      responseListKey: 'resultData',
      fixtureResponse: responses[response].fixture,
      response,
      selector,
      activeOnly,
      value,
      request: requestState,
    });
  }, [activeOnly, apiUrl, onData, requestState, response, selector, value]);

  return (
    <CoreDemo
      controls={
        <>
          <CoreChoice
            label="선택 방식"
            value={selector}
            options={selectorOptions}
            onChange={(next) => {
              setSelector(next);
              onRecord('selectorType', next);
            }}
          />
          <CoreChoice
            label="응답"
            value={response}
            options={responseOptions}
            onChange={(next) => {
              setResponse(next);
              setValue('');
              onRecord('response', next);
            }}
          />
          <CoreToggle
            label="사용 중인 항목만"
            value={activeOnly}
            onChange={(next) => {
              setActiveOnly(next);
              setValue('');
              onRecord('filterOptions', String(next));
            }}
          />
        </>
      }
    >
      <DemoSection>
        <div className="core-field">
          <OwpQuerySelector<QueryFixtureItem>
            apiUrl={apiUrl}
            query={{}}
            valueKey="id"
            labelResolver={(row) => (i18n.language === 'en' ? row.nameEn : row.nameKo)}
            {...(selector === 'Select'
              ? { selectorType: 'select' as const }
              : { selectorType: 'autocomplete' as const })}
            value={value}
            filterOptions={(rows) => (activeOnly ? rows.filter((row) => row.active) : rows)}
            queryKeyDeps={[activeOnly, i18n.language]}
            label={t('이름')}
            showAllOption={false}
            textFieldProps={{ variant: 'outlined', size: 'small' }}
            selectProps={{
              variant: 'outlined',
              size: 'small',
              input: <OutlinedInput label={t('이름')} />,
            }}
            fullWidth
            onChange={(event) => {
              setValue(event.target.value);
              onRecord('selection.change', event.target.value);
            }}
          />
        </div>
        {requestState.status === 'error' && (
          <Alert severity="error">
            {t('조회에 실패했습니다. 정상 응답으로 전환해 다시 조회하세요.')}
          </Alert>
        )}
      </DemoSection>
    </CoreDemo>
  );
}
