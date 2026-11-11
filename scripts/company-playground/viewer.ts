import type { CompanyBundle } from '../../mcp/company/bundle.ts';

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char,
  );
const json = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

export function companyViewerHtml(bundle: CompanyBundle, executable: boolean): string {
  const rows = Object.entries(bundle.manifest.packages)
    .map(
      ([id, pkg]) =>
        `<tr><th scope="row">${escape(pkg.packageName)}</th><td>${escape(pkg.version)}</td><td>${escape(id)}</td></tr>`,
    )
    .join('');
  const sections = bundle.spec.items
    .filter((item) => item.kind !== 'source')
    .map((item) => {
      const record = bundle.records.get(item.recordId ?? '');
      const body = record
        ? record.signature
        : bundle.read(`materials/${item.entrypoint ?? item.files[0]}`).toString('utf8');
      const files = item.files
        .map((file) => `<li><a href="./materials/${escape(file)}">${escape(file)}</a></li>`)
        .join('');
      return `<article data-search="${escape(`${item.title} ${item.description} ${item.recordId ?? item.id}`.toLocaleLowerCase())}" id="item-${escape(item.id)}"><p class="eyebrow">${escape(item.kind)} · ${escape(bundle.manifest.packages[item.packageId]?.packageName ?? '')}</p><h2>${escape(item.title)}</h2><p>${escape(item.description)}</p><pre tabindex="0"><code>${escape(body)}</code></pre><ul>${files}</ul>${executable && bundle.spec.executionAdapters.some((adapter) => adapter.itemId === item.id) ? `<h3>실행 예제</h3><div class="example" data-example="${escape(item.id)}"></div>` : ''}</article>`;
    })
    .join('');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>패키지 Playground</title><style>
:root{font-family:Geist,Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d242c;background:#f7f8fa;font-synthesis:none;line-height:1.65;word-break:keep-all}*{box-sizing:border-box}body{margin:0}main{max-width:1080px;margin:auto;padding:48px 28px 80px}header{padding-bottom:28px;border-bottom:1px solid #d9dee5}h1{font-size:clamp(1.8rem,4vw,2.4rem);letter-spacing:-.04em;line-height:1.2;margin:0 0 16px}h2{font-size:1.3rem;line-height:1.4;margin:4px 0 12px}h3{font-size:1rem}p{margin:10px 0}.muted,.eyebrow{color:#526171}.eyebrow{font-size:.8rem;font-weight:600;letter-spacing:.03em}code,pre,.identity{font-family:"Geist Mono",ui-monospace,SFMono-Regular,monospace}code,.identity{overflow-wrap:anywhere}.identity{font-size:.85rem}section{margin-top:28px}article{padding:30px 0;border-bottom:1px solid #d9dee5}pre{margin:20px 0;background:#fff;border:1px solid #d9dee5;border-radius:6px;padding:20px;overflow:auto;white-space:pre-wrap;font-size:.85rem}a{color:#1756a9;text-underline-offset:3px}a:hover{text-decoration-thickness:2px}:focus-visible{outline:3px solid #276bd1;outline-offset:4px}label{display:block;font-weight:600;margin-bottom:8px}input{width:100%;border:1px solid #9ca8b5;border-radius:6px;padding:12px 14px;font:inherit;background:white}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;background:#fff;text-align:left}th,td{padding:12px 16px;border-bottom:1px solid #d9dee5;vertical-align:top}thead{background:#edf0f4}th{font-weight:600}.status{padding:14px 18px;border-left:3px solid #66809e;background:#edf1f6}.example{padding:24px;border:1px solid #d9dee5;border-radius:6px;background:white}ul{padding-left:22px}[hidden]{display:none!important}@media(max-width:600px){main{padding:28px 18px 56px}th,td{padding:10px;font-size:.85rem}article{padding:24px 0}pre{padding:14px}}
</style></head><body><main><header><p class="eyebrow">제공 패키지 개발 자료</p><h1>패키지 Playground</h1><p class="identity">회사 ${escape(bundle.pin.companyId)}</p><p class="identity">Build ${escape(bundle.pin.buildId)} · Release ${escape(bundle.pin.releaseId)}</p><p class="identity muted">Manifest ${escape(bundle.pin.manifestDigest)}</p><p class="status">${executable ? '제공 패키지로 빌드한 실행 예제를 포함합니다. 브라우저 실행은 별도 확인이 필요합니다.' : '실행 예제 없이 자료를 확인하는 화면입니다. 패키지 실행은 미확인 상태입니다.'}</p></header><section aria-labelledby="packages"><h2 id="packages">제공 패키지</h2><div class="table-scroll" tabindex="0" role="region" aria-label="패키지 버전 표"><table><thead><tr><th scope="col">패키지</th><th scope="col">버전</th><th scope="col">ID</th></tr></thead><tbody>${rows}</tbody></table></div></section><section aria-label="자료 검색"><label for="search">자료 검색</label><input id="search" type="search" placeholder="API, 가이드, 예제 이름" autocomplete="off"><p id="count" aria-live="polite"></p></section><section aria-label="포함 자료">${sections}<p id="empty" hidden>검색 결과가 없습니다.</p></section></main><script type="module" src="./entry.js"></script></body></html>`;
}

export function companyViewerEntry(bundle: CompanyBundle, executable: boolean): string {
  const adapters = executable ? bundle.spec.executionAdapters : [];
  const imports = adapters
    .map(
      (adapter, index) =>
        `import { ${adapter.exportName} as Example${index} } from ${json(`./materials/${adapter.entry}`)};`,
    )
    .join('\n');
  const mounts = adapters
    .map(
      (adapter, index) =>
        `const target${index}=document.querySelector('[data-example='+CSS.escape(${json(adapter.itemId)})+']');if(target${index})createRoot(target${index}).render(createElement(Example${index},${json(adapter.props)}));`,
    )
    .join('\n');
  return `${adapters.length ? 'import {createElement} from "react";import {createRoot} from "react-dom/client";' : ''}\n${imports}\n${mounts}
const search=document.querySelector('#search');const articles=[...document.querySelectorAll('article[data-search]')];const count=document.querySelector('#count');const empty=document.querySelector('#empty');
function filter(){const words=search.value.toLocaleLowerCase().trim().split(/\\s+/).filter(Boolean);let found=0;for(const article of articles){article.hidden=!words.every(word=>article.dataset.search.includes(word));if(!article.hidden)found++;}count.textContent=found+'개 자료';empty.hidden=found!==0;}search.addEventListener('input',filter);filter();\n`;
}
