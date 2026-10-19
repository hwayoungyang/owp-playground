import { readGridData } from './read-api-data.mjs';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const output = '.omo/evidence/refinement';
await mkdir(output,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1100}});
const results=[]; const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const pass=(scenario,observed)=>{results.push({scenario,observed,pass:true});console.log('PASS',scenario,observed);};
async function load(id){await page.goto('http://127.0.0.1:4173/?package=datagrid&sample='+id);await page.locator('.grid-preview .OwpDataGrid-root').first().waitFor();}
async function data(){await page.getByRole('tab',{name:'데이터',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.code-scroll code')?.textContent.startsWith('['));return (await readGridData(page)).rows;}
async function edit(id,column,value){const index=["project","task","quantity","reserved","remaining","gap","completed","cost","amount","rate","appliedAmount","plannedAmount"].indexOf(column); const cells=page.locator(`[data-owp-data-grid-row-key="string:${id}"] .OwpDataGrid-cell`); const cell=cells.nth(index - (12 - await cells.count())); await cell.click();await page.keyboard.press('Enter');await page.locator('.grid-preview input:not([type=checkbox])').fill(String(value));await page.keyboard.press('Enter');}
async function preview(){await page.getByRole('tab',{name:'예제',exact:true}).click();}
try{
 await load('nested-tree');await page.getByRole('tab',{name:'코드',exact:true}).click();
 const source=await readFile('src/playgrounds/datagrid/examples/nested-tree.tsx','utf8');
 await page.waitForFunction(source=>document.querySelector('.code-scroll code')?.textContent===source,source);
 assert.ok(await page.locator('.code-scroll .hljs-name').count()>5);
 assert.ok((await page.locator('.code-scroll .hljs-name').allTextContents()).includes('OwpDataGrid'));
 pass('JSX return block has colored component tags and preserves source bytes',{tags:await page.locator('.code-scroll .hljs-name').count()});
 await load('worksheet');
 await edit('task-3','completed',80);let rows=await data();assert.equal(rows.find(r=>r.id==='task-4').rate,88);assert.equal(rows.find(r=>r.id==='task-8').rate,95);pass('same-project linked rate after task 3 completion',{rate:88});
 await preview();await edit('task-4','completed',60);rows=await data();assert.equal(rows.find(r=>r.id==='task-8').rate,93);pass('cross-project linked rate after upstream completion',{rate:93});
 await preview();await edit('rate-0','rate',50);rows=await data();assert.equal(rows.find(r=>r.id==='task-1').rate,50);assert.equal(rows.find(r=>r.id==='task-4').rate,48);assert.equal(rows.find(r=>r.id==='task-8').rate,93);pass('base rate updates all project items and retains cross-project link',{rates:rows.filter(r=>r.worksheetKind==='item').map(r=>r.rate)});
 await preview();await edit('task-1','cost',20000);await page.locator('.OwpDataGrid-viewport').evaluateAll(es=>es.forEach(e=>e.scrollLeft=e.scrollWidth));
 const texts=await page.locator('[data-owp-data-grid-row-key="string:task-1"] .OwpDataGrid-cell').allTextContents();assert.ok(texts.some(t=>t.replaceAll(',','')==='80000'));pass('applied cost recalculates from unit price and linked rate',{texts});
 await page.getByRole('button',{name:'초기화',exact:true}).click();rows=await data();assert.equal(rows.find(r=>r.id==='task-4').rate,90);assert.equal(rows.find(r=>r.id==='task-1').cost,12000);pass('reset restores inputs and all linked values',{rate:90,cost:12000});
 await load('reordering');await page.locator('[data-owp-data-grid-row-key="string:task-2"] input').check();
 await page.locator('[data-owp-data-grid-row-key="string:task-3"] input').check();
 const target=page.locator('[data-owp-data-grid-row-key="string:task-6"]');
 await page.locator('[data-owp-data-grid-row-key="string:task-2"] .OwpDataGrid-dragHandle').dragTo(target,{targetPosition:{x:120,y:38}});
 rows=await data();assert.deepEqual(rows.slice(0,6).map(r=>r.id),['task-1','task-4','task-5','task-6','task-2','task-3']);pass('real native drag moves selected rows together',{order:rows.map(r=>r.id)});
 await preview();await page.getByRole('button',{name:'단일 행',exact:true}).click();
 await page.locator('[data-owp-data-grid-row-key="string:task-2"] .OwpDataGrid-dragHandle').dragTo(page.locator('[data-owp-data-grid-row-key="string:task-1"]'),{targetPosition:{x:120,y:38}});
 rows=await data();assert.deepEqual(rows.slice(0,3).map(r=>r.id),['task-1','task-2','task-4']);pass('single mode moves only the dragged selected row',{order:rows.map(r=>r.id)});
 await preview();await page.getByRole('button',{name:'초기화',exact:true}).click();rows=await data();assert.deepEqual(rows.map(r=>r.id),Array.from({length:12},(_,i)=>'task-'+(i+1)));pass('reset restores native drag order',{rows:rows.length});
 await page.setViewportSize({width:375,height:1100});await load('worksheet');
 await page.waitForFunction(()=>document.querySelector('[data-owp-data-grid-row-key="string:task-1"]'));
 const mobile=await page.locator('.OwpDataGrid-horizontalScrollPanel *').evaluateAll(es=>es.filter(e=>getComputedStyle(e).overflowX==='scroll').map(e=>({width:e.clientWidth,total:e.scrollWidth})));
 assert.ok(mobile.some(e=>e.width>=150));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 pass('mobile worksheet keeps a full numeric cell and valid headers',{mobile});
 await writeFile(`${output}/functional.json`,JSON.stringify({results,errors},null,2));assert.deepEqual(errors,[]);
}finally{await browser.close();}
