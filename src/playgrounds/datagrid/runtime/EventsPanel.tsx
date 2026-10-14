import { Button } from '@mui/material';
import { BracketsCurlyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { DemoEvent } from './useDemo';

export function EventsPanel({
  events,
  onClear,
  onPreview,
}: {
  readonly events: readonly DemoEvent[];
  readonly onClear: () => void;
  readonly onPreview: () => void;
}) {
  const { t } = useTranslation('app');
  return (
    <>
      <div className="events-toolbar">
        <span>{t('최근 {{count}}개 · 최대 40개', { count: events.length })}</span>
        <Button onClick={onClear} disabled={events.length === 0}>
          {t('로그 지우기')}
        </Button>
      </div>
      {events.length === 0 ? (
        <div className="events-empty">
          <BracketsCurlyIcon size={28} />
          <h3>{t('아직 기록이 없습니다.')}</h3>
          <p>{t('선택·정렬·편집하면 이벤트가 여기에 표시됩니다.')}</p>
          <Button variant="outlined" onClick={onPreview}>
            {t('예제로 돌아가기')}
          </Button>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <details key={event.id}>
              <summary>
                <time>{event.time}</time>
                <span>{event.name}</span>
                <span>#{event.id}</span>
              </summary>
              <pre>{event.value}</pre>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
