import '../src/app/i18n';
import { OwpDateRangePicker } from '@owp/date-picker';
import dayjs from '@owp/date-picker/dayjs';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Provider } from '../src/app/providers/Provider';

it('renders the installed Date Picker range with its public dayjs entrypoint', () => {
  const html = renderToString(
    <Provider mode="light">
      <OwpDateRangePicker label="날짜 범위" value="2026-10-01,2026-10-31" onChange={() => {}} />
    </Provider>,
  );
  expect(html).toContain('2026');
  expect(html).toContain('input');
  expect(dayjs('2026-10-29').format('YYYY-MM-DD')).toBe('2026-10-29');
});
