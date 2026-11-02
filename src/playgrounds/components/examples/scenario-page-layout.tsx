import { useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { OwpPageContent, OwpSection, OwpTab, OwpTabs } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { ExampleSection } from '../runtime/ExampleSection';
import type { ComponentsExampleProps } from '../model/types';

export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [tab, setTab] = useState('summary');
  const [refreshes, setRefreshes] = useState(0);
  useEffect(() => {
    onData({ tab, refreshes });
  }, [tab, refreshes, onData]);
  return (
    <ExampleSection
      title="제목·작업 버튼·탭을 함께 배치"
      description="페이지 제목과 새로고침 버튼은 그대로 두고 탭에 따라 본문을 바꿉니다."
    >
      <OwpPageContent
        title={t('재고 현황')}
        responsiveLayout
        actions={
          <Button
            variant="outlined"
            onClick={() => {
              setRefreshes((previous) => previous + 1);
              onRecord('page.refresh', String(refreshes + 1));
            }}
          >
            {t('새로고침')}
          </Button>
        }
      >
        <Stack spacing={2} sx={{ py: 2 }}>
          <OwpTabs
            value={tab}
            aria-label={t('재고 정보 탭')}
            onChange={(_, value: unknown) => {
              if (value === 'summary' || value === 'history') {
                setTab(value);
                onRecord('page.tab', value);
              }
            }}
          >
            <OwpTab
              value="summary"
              label={t('재고 요약')}
              id="inventory-summary-tab"
              aria-controls="inventory-summary-panel"
            />
            <OwpTab
              value="history"
              label={t('조회 내역')}
              id="inventory-history-tab"
              aria-controls="inventory-history-panel"
            />
          </OwpTabs>
          <div
            role="tabpanel"
            hidden={tab !== 'summary'}
            id="inventory-summary-panel"
            aria-labelledby="inventory-summary-tab"
          >
            <OwpSection title={t('재고 요약')} disableTitleIcon>
              <Typography variant="body2">
                {t('총 2개 품목의 재고를 관리하는 예제입니다.')}
              </Typography>
            </OwpSection>
          </div>
          <div
            role="tabpanel"
            hidden={tab !== 'history'}
            id="inventory-history-panel"
            aria-labelledby="inventory-history-tab"
          >
            <OwpSection title={t('조회 내역')} disableTitleIcon>
              <Typography variant="body2">
                {t('새로고침 {{count}}회', { count: refreshes })}
              </Typography>
            </OwpSection>
          </div>
        </Stack>
      </OwpPageContent>
    </ExampleSection>
  );
}
