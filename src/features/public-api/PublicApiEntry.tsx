import { useOwpTranslation } from '@owp/components/hooks';
import { Button, Tab, Tabs, TextField } from '@mui/material';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { ReferenceWorkbench, type WorkbenchMode } from '../../shared/ui/ReferenceWorkbench';
import { CodeSnippet } from '../code/CodeSnippet';
import { ContractContent, contractTabs, type ContractTab } from './ContractContent';
import { displayPublicDescription } from './descriptions';
import { PublicApiCode } from './PublicApiCode';
import type { PublicApiEntry as EntryData } from './types';

export function PublicApiEntry({ entry }: { readonly entry: EntryData }) {
  const { t, i18n } = useOwpTranslation();
  const prefix = useId();
  const contracts = contractTabs([entry]);
  const requested =
    typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('tab');
  const initialTab =
    requested === 'code'
      ? 'code'
      : (contracts.find((value) => value === requested) ?? contracts[0] ?? 'code');
  const [tab, setTab] = useState<ContractTab | 'code'>(initialTab);
  const [contract, setContract] = useState<ContractTab | undefined>(
    contracts.find((value) => value === initialTab) ?? contracts[0],
  );
  const [mode, setMode] = useState<WorkbenchMode>(initialTab === 'code' ? 'code' : 'split');
  const [exampleId, setExampleId] = useState(
    entry.examples[0] ? `${entry.examples[0].packageId}/${entry.examples[0].id}` : '',
  );
  const example = entry.examples.find((item) => `${item.packageId}/${item.id}` === exampleId);
  const changeTab = (next: ContractTab | 'code') => {
    setTab(next);
    if (next !== 'code') setContract(next);
    setMode(next === 'code' ? 'code' : 'split');
    const url = new URL(location.href);
    url.searchParams.set('tab', next);
    history.replaceState(null, '', url);
  };
  const code = (
    <div role="tabpanel" id={`${prefix}-panel-code`} aria-labelledby={`${prefix}-tab-code`}>
      <PublicApiCode entry={entry} example={example} />
    </div>
  );
  const navigation = (
    <div className="workspace-navigation public-api-navigation">
      <Tabs
        value={tab}
        variant="scrollable"
        scrollButtons="auto"
        aria-label={t('API 상세 보기')}
        onChange={(_, value: unknown) => {
          if (value === 'code') changeTab('code');
          else {
            const next = contracts.find((candidate) => candidate === value);
            if (next) changeTab(next);
          }
        }}
      >
        {contracts.map((value) => (
          <Tab
            key={value}
            value={value}
            id={`${prefix}-tab-${value}`}
            aria-controls={`${prefix}-panel-${value}`}
            label={t({ props: 'Props', params: 'Params', returns: 'Returns', type: 'Type' }[value])}
          />
        ))}
        <Tab
          value="code"
          id={`${prefix}-tab-code`}
          aria-controls={`${prefix}-panel-code`}
          label={t('코드')}
        />
      </Tabs>
    </div>
  );
  return (
    <>
      <p className="components-api-description components-api-original">
        {displayPublicDescription(entry, (key, values) => t(key, values))}
      </p>
      <div className="public-api-entry-actions">
        {entry.owner !== `@owp/${entry.packageId}` && (
          <p className="components-api-meta">
            {t('{{name}}의 API를 re-export합니다.', { name: entry.owner })}
          </p>
        )}
        {example && (
          <Button
            component={PlaygroundLink}
            href={`?${new URLSearchParams({ package: example.packageId, sample: example.id, lang: i18n.language })}`}
            variant="outlined"
            size="small"
            endIcon={<ArrowUpRightIcon size={14} aria-hidden />}
          >
            {t('관련 예제로 이동')}
          </Button>
        )}
      </div>
      {entry.examples.length > 1 && (
        <TextField
          select
          size="small"
          className="public-api-example-select"
          label={t('관련 실행 예제')}
          value={exampleId}
          onChange={(event) => setExampleId(event.target.value)}
          slotProps={{ select: { native: true } }}
        >
          {entry.examples.map((item) => (
            <option key={`${item.packageId}/${item.id}`} value={`${item.packageId}/${item.id}`}>
              {t(item.title)}
            </option>
          ))}
        </TextField>
      )}
      {entry.imports[0] && (
        <div className="public-api-import">
          <CodeSnippet label="Import" code={entry.imports[0]} language="typescript" />
        </div>
      )}
      {entry.imports.length > 1 && (
        <details className="public-api-alternate-imports">
          <summary>{t('다른 공개 진입점')}</summary>
          {entry.imports.slice(1).map((statement) => (
            <CodeSnippet key={statement} label="Import" code={statement} language="typescript" />
          ))}
        </details>
      )}

      {contract ? (
        <ReferenceWorkbench
          idPrefix={prefix}
          mode={mode}
          activePanel={tab === 'code' ? 'code' : 'content'}
          onModeChange={(next) => {
            if (next === 'code') changeTab('code');
            else {
              changeTab(contract);
              setMode(next);
            }
          }}
          code={code}
          navigation={navigation}
        >
          {contracts.map((value) => (
            <div
              key={value}
              hidden={contract !== value}
              role="tabpanel"
              id={`${prefix}-panel-${value}`}
              aria-labelledby={`${prefix}-tab-${value}`}
              className="public-api-panel"
            >
              {contract === value && <ContractContent entry={entry} tab={value} />}
            </div>
          ))}
        </ReferenceWorkbench>
      ) : (
        <>
          {navigation}
          <div className="public-api-code-only">{code}</div>
        </>
      )}
    </>
  );
}
