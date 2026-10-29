import { createHash } from 'node:crypto';
import { z } from 'zod';
import { archiveRelativePathSchema, releaseFileSchema, releaseIndexEntrySchema, type ReleaseIndexEntry } from '../src/features/releases/model/schema.ts';
import { appEnglish } from '../src/shared/i18n/app.en.ts';

export const versionUiRuntimePath = 'version-ui/runtime.json';
const versionMenuLabels = { failed: '버전 목록을 불러오지 못했습니다.', loading: '버전 목록을 불러오는 중입니다.', retry: '다시 시도' } as const;
const versionMenuMessages = {
  ko: versionMenuLabels,
  en: { failed: appEnglish[versionMenuLabels.failed], loading: appEnglish[versionMenuLabels.loading], retry: appEnglish[versionMenuLabels.retry] },
} as const;
export const versionUiRuntimeSchema = z.object({
  schemaVersion: z.literal(1),
  entry: releaseFileSchema.unwrap().extend({ path: archiveRelativePathSchema.refine((file) => /^assets\/version-menu-[A-Za-z0-9_-]+\.js$/.test(file)) }),
}).strict().readonly();
export type VersionUiRuntime = {
  readonly basePath: string;
  readonly descriptor: z.infer<typeof versionUiRuntimeSchema>;
  readonly fingerprint: string;
};
export const presentationEntrySchema = z.object({
  release: releaseIndexEntrySchema,
  rawPath: z.string(),
  raw: releaseFileSchema,
  presentation: releaseFileSchema,
  runtimeFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
}).strict().readonly();

export function fileFingerprint(bytes: Uint8Array) {
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function readVersionUiRuntime(basePath: string, read: (file: string) => Promise<Buffer>): Promise<VersionUiRuntime> {
  const bytes = await read(versionUiRuntimePath);
  const descriptor = versionUiRuntimeSchema.parse(JSON.parse(bytes.toString('utf8')));
  const entry = fileFingerprint(await read(descriptor.entry.path));
  if (entry.bytes !== descriptor.entry.bytes || entry.sha256 !== descriptor.entry.sha256) {
    throw new TypeError('공통 버전 메뉴 runtime의 내용이 descriptor와 다릅니다.');
  }
  const fingerprint = createHash('sha256').update(bytes).update('\0').update(captureGate)
    .update('\0').update(JSON.stringify(versionMenuMessages)).digest('hex');
  return { basePath, descriptor, fingerprint };
}

// 이전 앱의 React 이벤트보다 먼저 실행하며, 별도 root가 준비될 때까지 클릭을 보관합니다.
const captureGate = String.raw`(function(config){
  var pending=null,serial=0,modulePromise=null,closeCurrent=null;
  function close(){serial++;pending=null;if(closeCurrent){closeCurrent();closeCurrent=null;}document.querySelectorAll('.version-ui-loader').forEach(function(node){node.remove();});}
  function message(button,failed){
    document.querySelectorAll('.version-ui-loader').forEach(function(node){node.remove();});
    var panel=document.createElement('div');panel.className='version-ui-loader';panel.setAttribute('role','status');
    panel.style.cssText='position:fixed;z-index:1500;right:16px;top:64px;padding:16px;background:var(--pg-canvas,#fff);color:var(--pg-ink,#171717);border:1px solid var(--pg-line,#ddd);border-radius:4px;font:13px var(--font-ui,sans-serif)';
    var english=document.documentElement.lang==='en';
    var messages=config.messages[english?'en':'ko'];
    panel.textContent=messages[failed?'failed':'loading']+' ';
    if(failed){var retry=document.createElement('button');retry.textContent=messages.retry;retry.onclick=function(){open(button);};panel.appendChild(retry);}
    document.body.appendChild(panel);
  }
  function open(button){
    close();var attempt=serial;pending=button;button.setAttribute('aria-expanded','true');message(button,false);
    if(!modulePromise)modulePromise=new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new TypeError('Version menu runtime timeout'));},10000);
      import(config.module+'?versionUiAttempt='+attempt).then(function(value){clearTimeout(timer);resolve(value);},function(error){clearTimeout(timer);reject(error);});
    });
    modulePromise.then(function(runtime){
      if(attempt!==serial||pending!==button||!button.isConnected)return;
      document.querySelectorAll('.version-ui-loader').forEach(function(node){node.remove();});
      closeCurrent=runtime.openVersionMenu(button,config,function(){pending=null;button.setAttribute('aria-expanded','false');});
    }).catch(function(error){
      if(attempt!==serial)return;modulePromise=null;button.setAttribute('aria-expanded','false');message(button,true);console.error(error);
    });
  }
  document.addEventListener('click',function(event){
    var target=event.target instanceof Element?event.target.closest('.version-selector'):null;
    if(!target)return;event.preventDefault();event.stopImmediatePropagation();
    if(pending===target){close();target.setAttribute('aria-expanded','false');target.focus();}else open(target);
  },true);
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&pending){var button=pending;close();button.setAttribute('aria-expanded','false');button.focus();}
    var button=event.target instanceof Element?event.target.closest('.version-selector'):null;
    if(button&&event.key==='ArrowDown'){event.preventDefault();event.stopImmediatePropagation();open(button);}
  },true);
  document.addEventListener('pointerdown',function(event){
    if(!pending||closeCurrent)return;
    if(event.target instanceof Element&&!event.target.closest('.version-selector,.version-ui-loader')){var button=pending;close();button.setAttribute('aria-expanded','false');}
  },true);
  window.addEventListener('pagehide',close);
})(`;

export function createVersionPresentation(raw: Buffer, release: ReleaseIndexEntry, runtime: VersionUiRuntime) {
  if (/data-version-ui\s*=/.test(raw.toString('utf8'))) throw new TypeError('버전 메뉴가 이미 연결된 HTML에는 다시 연결할 수 없습니다.');
  const config = JSON.stringify({ release, runtimeFingerprint: runtime.fingerprint, module: `${runtime.basePath}${runtime.descriptor.entry.path}`,
    messages: versionMenuMessages,
  }).replaceAll('<', '\\u003c');
  const injection = `<script data-version-ui="${runtime.fingerprint}">${captureGate}${config});</script>`;
  const html = raw.toString('utf8');
  const charset = /<meta\b[^>]*\bcharset\s*=\s*(?:"utf-8"|'utf-8'|utf-8\b)[^>]*>/i.exec(html);
  const firstScript = /<script\b/i.exec(html);
  const charsetEnd = charset ? charset.index + charset[0].length : 0;
  // 인코딩 선언을 첫 1024 bytes에 유지하고 기존 script보다 먼저 gate를 등록합니다.
  const projected = charset && Buffer.byteLength(html.slice(0, charsetEnd)) <= 1024 && (!firstScript || charsetEnd <= firstScript.index)
    ? `${html.slice(0, charsetEnd)}${injection}${html.slice(charsetEnd)}`
    : /<head\b[^>]*>/i.test(html)
      ? html.replace(/<head\b[^>]*>/i, (head) => `${head}<meta charset="UTF-8">${injection}`)
      : html.replace(/^(<!doctype[^>]*>)?/i, (doctype) => `${doctype}<meta charset="UTF-8">${injection}`);
  return Buffer.from(projected);
}

export function versionPresentationEntry(raw: Buffer, release: ReleaseIndexEntry, runtime: VersionUiRuntime) {
  return {
    release,
    rawPath: `/version-ui/raw/${release.releaseId}/index.html`,
    raw: fileFingerprint(raw),
    presentation: fileFingerprint(createVersionPresentation(raw, release, runtime)),
    runtimeFingerprint: runtime.fingerprint,
  };
}
