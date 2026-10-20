import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';
import { connectBrowserForVerification, readBrowserEndpoint, readLighthouseConnection } from '../browser-session.mjs';

const execute = promisify(execFile);
const root = new URL('../../', import.meta.url);
const environment = { PLAYGROUND_BROWSER_CDP_URL: 'http://127.0.0.1:9222' };

function fixture({ contextError, pageError, closeError } = {}) {
  const calls = [];
  const existingContext = { close: () => calls.push('close existing context') };
  const browser = {
    contexts: () => [existingContext],
    newContext: async (options) => {
      calls.push(['new context', options]);
      if (contextError) throw contextError;
      return {
        newPage: async () => {
          if (pageError) throw pageError;
          return { url: () => 'about:blank' };
        },
        close: async () => {
          calls.push('close test context');
          if (closeError) throw closeError;
        },
      };
    },
    close: async () => { calls.push('disconnect'); },
  };
  const connect = async (endpoint, options) => {
    calls.push(['connect', endpoint, options]);
    return browser;
  };
  return { calls, connect };
}

test('missing connection information fails before connecting to a browser', async () => {
  // Given
  const { calls, connect } = fixture();
  // When / Then
  await assert.rejects(connectBrowserForVerification({ environment: {}, connect }), /PLAYGROUND_BROWSER_CDP_URL/);
  assert.deepEqual(calls, []);
});

test('invalid endpoint values fail without connecting', async (t) => {
  for (const value of ['', '  ', 'not a URL', 'file:///Applications/Google%20Chrome.app']) {
    await t.test(JSON.stringify(value), async () => {
      // Given
      const { calls, connect } = fixture();
      // When / Then
      await assert.rejects(connectBrowserForVerification({ environment: { PLAYGROUND_BROWSER_CDP_URL: value }, connect }));
      assert.deepEqual(calls, []);
    });
  }
});

test('HTTP and WebSocket endpoints retain the supplied connection information', () => {
  // Given
  const values = ['http://127.0.0.1:9222/', 'https://browser.example/cdp', 'ws://127.0.0.1:9222/devtools/browser/example', 'wss://browser.example/cdp'];
  // When / Then
  for (const value of values) assert.equal(readBrowserEndpoint({ PLAYGROUND_BROWSER_CDP_URL: value }).href, value);
});

test('connection failure propagates after one attempt without a retry', async () => {
  // Given
  const failure = new Error('existing connection unavailable');
  let attempts = 0;
  const connect = async () => { attempts += 1; throw failure; };
  // When / Then
  await assert.rejects(connectBrowserForVerification({ environment, connect }), (error) => error === failure);
  assert.equal(attempts, 1);
});

test('cleanup closes only test contexts before disconnecting', async () => {
  // Given
  const { calls, connect } = fixture();
  const session = await connectBrowserForVerification({ environment, connect });
  const options = { viewport: { width: 1280, height: 900 } };
  await session.newContext(options);
  // When
  await session.close();
  // Then
  assert.deepEqual(calls, [
    ['connect', 'http://127.0.0.1:9222/', { timeout: 10000 }],
    ['new context', options],
    'close test context',
    'disconnect',
  ]);
});

test('newPage creates its own context and preserves viewport options', async () => {
  // Given
  const { calls, connect } = fixture();
  const session = await connectBrowserForVerification({ environment, connect });
  const options = { viewport: { width: 1440, height: 1100 } };
  // When
  const page = await session.newPage(options);
  await session.close();
  // Then
  assert.equal(page.url(), 'about:blank');
  assert.deepEqual(calls.slice(1), [['new context', options], 'close test context', 'disconnect']);
});

test('context creation failure disconnects the existing browser', async () => {
  // Given
  const failure = new Error('context creation failed');
  const { calls, connect } = fixture({ contextError: failure });
  const session = await connectBrowserForVerification({ environment, connect });
  // When / Then
  await assert.rejects(session.newContext(), (error) => error === failure);
  assert.equal(calls.at(-1), 'disconnect');
});

test('page creation failure closes the test context and disconnects', async () => {
  // Given
  const failure = new Error('page creation failed');
  const { calls, connect } = fixture({ pageError: failure });
  const session = await connectBrowserForVerification({ environment, connect });
  // When / Then
  await assert.rejects(session.newPage(), (error) => error === failure);
  assert.deepEqual(calls.slice(-2), ['close test context', 'disconnect']);
});

test('context cleanup failure still disconnects and reports the error', async () => {
  // Given
  const failure = new Error('context close failed');
  const { calls, connect } = fixture({ closeError: failure });
  const session = await connectBrowserForVerification({ environment, connect });
  await session.newContext();
  await session.newContext();
  // When / Then
  await assert.rejects(session.close(), (error) => error instanceof AggregateError && error.errors.every((item) => item === failure));
  assert.deepEqual(calls.slice(-3), ['close test context', 'close test context', 'disconnect']);
});

test('Lighthouse uses the existing HTTP endpoint host and port', () => {
  // Given / When / Then
  assert.deepEqual(readLighthouseConnection(environment), { hostname: '127.0.0.1', port: 9222 });
  assert.deepEqual(readLighthouseConnection({ PLAYGROUND_BROWSER_CDP_URL: 'http://[::1]:9333' }), { hostname: '::1', port: 9333 });
  for (const value of ['ws://127.0.0.1:9222/devtools/browser/example', 'http://localhost', 'http://localhost:9222/cdp', 'http://localhost:9222/?token=secret']) {
    assert.throws(() => readLighthouseConnection({ PLAYGROUND_BROWSER_CDP_URL: value }), /HTTP CDP endpoint/);
  }
});

async function assertBrowserPolicy() {
  const directory = new URL('../', import.meta.url);
  const files = (await readdir(directory)).filter((file) => /^(?:verify.*|audit|browser-session)\.mjs$/.test(file));
  for (const file of files) {
    const source = await readFile(new URL(file, directory), 'utf8');
    assert.doesNotMatch(source, /\.\s*(?:launch|launchPersistentContext)\s*\(|executablePath\s*:|--remote-debugging|node:child_process/, file);
    if (file !== 'browser-session.mjs') {
      assert.match(source, /connectBrowserForVerification/, file);
      assert.doesNotMatch(source, /from ['"](?:playwright|puppeteer)['"]/, file);
    }
  }
  return files;
}

test('every browser verification entrypoint follows the shared connection policy', async () => {
  // Given / When
  const files = await assertBrowserPolicy();
  // Then
  assert.ok(files.includes('verify-locales.mjs'));
  assert.ok(files.includes('verify-navigation.mjs'));
  assert.ok(files.includes('audit.mjs'));
});

test('browser CLI entrypoints report a missing connection instead of launching Chrome', async (t) => {
  // Given
  await assertBrowserPolicy();
  const childEnvironment = { ...process.env };
  delete childEnvironment.PLAYGROUND_BROWSER_CDP_URL;
  for (const script of ['verify-locales.mjs', 'verify-navigation.mjs', 'audit.mjs']) {
    await t.test(script, async () => {
      // When / Then
      await assert.rejects(execute(process.execPath, [`scripts/${script}`], { cwd: root, env: childEnvironment, timeout: 15000 }), (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /PLAYGROUND_BROWSER_CDP_URL/);
        assert.doesNotMatch(error.stderr, /<launching>|SIGABRT|browserType\.launch/);
        return true;
      });
    });
  }
});
