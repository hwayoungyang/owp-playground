import { Button } from '@mui/material';
import { BracketsCurlyIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { EventLogEntry } from '../types/events';

export function EventsPanel({
  events,
  limit,
  onClear,
  onPreview,
}: {
  readonly events: readonly EventLogEntry[];
  readonly limit: number;
  readonly onClear: () => void;
  readonly onPreview: () => void;
}) {
  const { t } = useTranslation('app');
  return (
    <div className="events-panel">
      <div className="events-toolbar">
        <span>{t('최근 {{count}}개 · 최대 {{limit}}개', { count: events.length, limit })}</span>
        <Button onClick={onClear} disabled={events.length === 0}>
          {t('이벤트 지우기')}
        </Button>
      </div>
      {events.length === 0 ? (
        <div className="events-empty">
          <BracketsCurlyIcon size={28} aria-hidden />
          <h3>{t('아직 기록된 이벤트가 없습니다.')}</h3>
          <Button variant="outlined" onClick={onPreview}>
            {t('예제로 돌아가기')}
          </Button>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => (
            <details key={event.id}>
              <summary>
                <CaretRightIcon className="event-chevron" size={12} aria-hidden />
                <time>{event.time}</time>
                <span className="event-name">{event.name}</span>
                <span className="event-id">#{event.id}</span>
              </summary>
              <pre>{event.value}</pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
