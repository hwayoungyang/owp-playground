import '../src/app/i18n';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ApiRequestResult } from '../src/playgrounds/core/examples/components/api-request-result';
import { JsonResult } from '../src/features/code/JsonResult';

vi.mock('../src/features/code/HighlightedCode', () => ({
  HighlightedCode: ({ html }: { readonly html: string }) => <code>{html}</code>,
}));

describe('API result presentation', () => {
  const data = { resultCode: 'STATUS_0', resultMessage: 'Operation rejected', resultData: [] };

  it('separates rejected business responses from guidance and shows the whole JSON', () => {
    const html = renderToStaticMarkup(
      <ApiRequestResult
        pending={false}
        responseMode="owp"
        outcome={{
          kind: 'error',
          message: data.resultMessage,
          response: { status: 200, body: { kind: 'json', value: data } },
        }}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('업무 처리 실패');
    expect(html).toContain('HTTP 상태: 200');
    expect(html).toContain('response.json');
    expect(html).toContain('STATUS_0');
    expect(html).toContain('Operation rejected');
    expect(html).toContain('resultData');
  });

  it.each(['owp', 'raw'] as const)('preserves resolved %s mode semantics', (responseMode) => {
    const html = renderToStaticMarkup(
      <ApiRequestResult
        pending={false}
        responseMode={responseMode}
        outcome={{ kind: 'success', data }}
      />,
    );
    expect(html).toContain(responseMode === 'owp' ? '업무 오류 응답' : '요청 완료');
    expect(html).toContain(
      responseMode === 'owp' ? 'MuiAlert-colorWarning' : 'MuiAlert-colorSuccess',
    );
    expect(html).toContain('STATUS_0');
  });

  it('does not invent response JSON for a network error', () => {
    const html = renderToStaticMarkup(
      <ApiRequestResult
        pending={false}
        responseMode="owp"
        outcome={{ kind: 'error', message: 'Network unavailable' }}
      />,
    );
    expect(html).toContain('요청 실패');
    expect(html).not.toContain('response.json');
    expect(html).not.toContain('HTTP 상태');
  });

  it('shows progress instead of a previous response while requesting', () => {
    const html = renderToStaticMarkup(
      <ApiRequestResult pending responseMode="owp" outcome={{ kind: 'success', data }} />,
    );
    expect(html).toContain('요청 중입니다.');
    expect(html).not.toContain('response.json');
  });

  it.each([false, 0, '', null, [], {}])(
    'keeps JSON result %j visible in a copyable snippet',
    (value) => {
      const html = renderToStaticMarkup(<JsonResult value={value} />);
      expect(html).toContain('result.json');
      expect(html).toContain('aria-label="result.json 복사"');
      expect(html).toContain('<code>');
    },
  );
});
