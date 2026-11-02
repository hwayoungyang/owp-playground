import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { EventsPanel } from '../src/shared/ui/EventsPanel';

vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

it('shows event JSON in a copyable snippet without rounding the original numbers', () => {
  const html = renderToStaticMarkup(
    <EventsPanel
      limit={50}
      onClear={() => {}}
      onPreview={() => {}}
      events={[
        {
          id: 1,
          time: '13:00:00',
          name: 'request.success',
          value: '{"id":9007199254740993,"value":false}',
        },
      ]}
    />,
  );
  expect(html).toContain('9007199254740993');
  expect(html).toContain('event.json 복사');
  expect(html).toContain('aria-label="event.json"');
});
