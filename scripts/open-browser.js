import { execFileSync } from 'node:child_process';

const url = new URL(process.argv.at(-1));
const origins = [url.origin];
if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  for (const hostname of ['localhost', '127.0.0.1', '[::1]']) {
    const alias = new URL(url);
    alias.hostname = hostname;
    origins.push(alias.origin);
  }
}

// URL은 코드에 삽입하지 않고 osascript의 인수로 전달합니다.
const script = `
function run(origins) {
  ObjC.import('AppKit');
  var appURL = $.NSWorkspace.sharedWorkspace.URLForApplicationToOpenURL($.NSURL.URLWithString(origins[0]));
  var bundleId = ObjC.unwrap($.NSBundle.bundleWithURL(appURL).bundleIdentifier);
  var chromium = [
    'com.google.Chrome', 'com.google.Chrome.canary', 'com.google.Chrome.dev',
    'com.google.Chrome.beta', 'com.microsoft.edgemac', 'com.brave.Browser',
    'com.vivaldi.Vivaldi', 'org.chromium.Chromium'
  ].indexOf(bundleId) !== -1;
  var safari = bundleId === 'com.apple.Safari';
  if (!chromium && !safari) return 'missing';
  var browser = Application(bundleId);
  if (!browser.running()) return 'missing';
  var windows = browser.windows();
  for (var w = 0; w < windows.length; w++) {
    var tabs = windows[w].tabs();
    for (var t = 0; t < tabs.length; t++) {
      var currentURL = tabs[t].url();
      var matches = origins.some(function(origin) {
        return currentURL === origin || currentURL.indexOf(origin + '/') === 0;
      });
      if (!matches) continue;
      if (safari) {
        windows[w].currentTab = tabs[t];
        tabs[t].url = currentURL;
      } else {
        windows[w].activeTabIndex = t + 1;
        tabs[t].reload();
      }
      windows[w].index = 1;
      browser.activate();
      return 'reused';
    }
  }
  return 'missing';
}
`;

let result = 'missing';
try {
  result = execFileSync('osascript', ['-l', 'JavaScript', '-e', script, ...origins], {
    encoding: 'utf8',
    timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
} catch (error) {
  if (!(error instanceof Error)) throw error;
  console.warn('기존 브라우저 탭을 확인하지 못해 기본 브라우저로 엽니다.', error.message);
}

if (result !== 'reused') {
  execFileSync('open', [url.href], { stdio: 'inherit' });
}
