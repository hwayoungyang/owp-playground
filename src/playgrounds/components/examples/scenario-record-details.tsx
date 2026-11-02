import { useEffect, useState } from 'react';
import { Stack } from '@mui/material';
import { OwpFieldTable, OwpOptionSelector, OwpSection, OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { ExampleSection } from '../runtime/ExampleSection';
import type { ComponentsExampleProps } from '../model/types';

const records = [
  { id: 'A-100', name: '센서 모듈', location: '창고 A', quantity: 24, unitPrice: 1500 },
  { id: 'B-200', name: '제어 보드', location: '창고 B', quantity: 12, unitPrice: 3200 },
] as const;
export function ComponentsExample({ onData, onRecord }: ComponentsExampleProps) {
  const { t } = useOwpTranslation();
  const [id, setId] = useState('A-100');
  const record = records.find((item) => item.id === id) ?? records[0];
  useEffect(() => {
    onData({ selectedId: id, record });
  }, [id, record, onData]);
  return (
    <>
      <ExampleSection title="상세 정보를 볼 항목 선택">
        <Stack sx={{ maxWidth: 320 }}>
          <OwpOptionSelector
            label={t('항목')}
            value={id}
            size="small"
            fullWidth
            options={records.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(event) => {
              setId(event.target.value);
              onRecord('details.select', event.target.value);
            }}
          />
        </Stack>
      </ExampleSection>
      <ExampleSection
        title="선택한 항목의 정보"
        description="같은 데이터를 기본 정보 표와 수량 내역 표에 연결합니다."
      >
        <Stack spacing={2}>
          <OwpSection title={t('기본 정보')} disableTitleIcon>
            <OwpFieldTable
              data={record}
              titleWidth="35%"
              layout={[
                [
                  { title: t('품목 코드'), key: 'id' },
                  { title: t('항목명'), key: 'name' },
                ],
                [{ title: t('보관 위치'), key: 'location' }],
              ]}
            />
          </OwpSection>
          <OwpSection title={t('수량과 단가')} disableTitleIcon>
            <OwpTable
              headers={{ quantity: t('재고 수량'), unitPrice: t('개당 가격') }}
              rows={[record]}
              size="small"
              containerProps={{ sx: { overflowX: 'auto' } }}
            />
          </OwpSection>
        </Stack>
      </ExampleSection>
    </>
  );
}
