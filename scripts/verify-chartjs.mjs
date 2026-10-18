import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { chartDataText, readChartData } from './chart-data.mjs';

const origin = process.env.PLAYGROUND_URL ?? 'http://127.0.0.1:4173';
const output = new URL('../.omo/evidence/charts-chartjs-expansion/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1280,height:900}});
await context.addInitScript(()=>{
  window.motionFrames=[];
  window.axisLabels=[];
  window.axisGrids=[];
  window.activeIntervals=new Set();
  const interval=window.setInterval, clear=window.clearInterval;
  window.setInterval=(callback,delay,...args)=>{const id=interval(callback,delay,...args);if(delay===1000)window.activeIntervals.add(id);return id;};
  window.clearInterval=id=>{window.activeIntervals.delete(id);return clear(id);};
  const paths=new WeakMap();
  for(const prototype of [Path2D.prototype,CanvasRenderingContext2D.prototype]){
    for(const name of ['moveTo','lineTo','bezierCurveTo']){
      const original=prototype[name];
      prototype[name]=function(...args){if(!paths.has(this))paths.set(this,[]);paths.get(this).push(args.slice(-2));return original.apply(this,args);};
    }
  }
  const proto=CanvasRenderingContext2D.prototype;
  const clearRect=proto.clearRect,fillText=proto.fillText;
  proto.clearRect=function(...args){if(this.canvas.closest('.chart-preview')){window.axisLabels=[];window.axisGrids=[];}return clearRect.apply(this,args);};
  proto.fillText=function(text,x,y,...args){if(this.canvas.closest('.chart-preview')&&/^\d{2}:\d{2}$/.test(String(text))){const matrix=this.getTransform();window.axisLabels.push({text:String(text),x:matrix.a*x+matrix.c*y+matrix.e});}return fillText.call(this,text,x,y,...args);};
  const begin=proto.beginPath,stroke=proto.stroke;
  proto.beginPath=function(...args){paths.set(this,[]);return begin.apply(this,args);};
  proto.stroke=function(...args){
    const path=args[0] instanceof Path2D?args[0]:this;
    const points=paths.get(path);
    if(this.canvas.closest('.chart-preview')&&points?.length===2&&Math.abs(points[0][0]-points[1][0])<.001&&Math.abs(points[0][1]-points[1][1])>100)window.axisGrids.push(points[0][0]);
    if(this.canvas.closest('.chart-preview') && points?.length>=10 && this.lineWidth===2){
      window.motionFrames.push({time:performance.now(),color:this.strokeStyle,points,labels:[...window.axisLabels],grids:[...window.axisGrids]});
      if(window.motionFrames.length>500)window.motionFrames.shift();
    }
    return stroke.apply(this,args);
  };
});
const page=await context.newPage();
const errors=[], results=[];
page.on('pageerror',error=>errors.push(error.message));
const open=async id=>{await page.goto(`${origin}/?package=charts&sample=${id}`);await page.locator('.chart-preview canvas, .chart-preview .OwpDataGrid-root').first().waitFor();await page.waitForFunction(()=>document.querySelector('.chart-status')?.textContent.includes('데이터'));};
const pass=(scenario,observed)=>{results.push({scenario,observed,pass:true});console.log('PASS',scenario);};
const shot=async name=>page.screenshot({path:new URL(`${name}.png`,output).pathname,fullPage:true});
try{
  await open('live');
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  await page.getByRole('button',{name:'일시정지',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.activeIntervals.size),0);
  await page.evaluate(()=>{window.motionFrames=[];});
  await page.getByRole('button',{name:'한 건 추가',exact:true}).click();
  await page.waitForTimeout(80);
  const pausedAppendFrames=await page.evaluate(()=>window.motionFrames.length);
  await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>window.motionFrames.length),pausedAppendFrames,'Appending while paused must not schedule animation frames');
  await page.evaluate(()=>{window.motionFrames=[];});
  await page.getByRole('button',{name:'다시 시작',exact:true}).click();
  await page.waitForTimeout(350); await shot('live-moving');
  await page.waitForTimeout(400);
  const frames=await page.evaluate(()=>window.motionFrames);
  await writeFile(new URL('live-motion-frames.json',output),JSON.stringify(frames));
  assert.ok(frames.length>=15,`Too few animation frames: ${frames.length}`);
  // Match an unchanged measurement by its Y coordinate across the update.
  const first=frames[0],last=frames.at(-1);
  const point=first.points.find(([x,y])=>x>300&&x<700&&Number.isFinite(y));
  assert.ok(point);
  const path=frames.map(frame=>frame.points.find(([,y])=>Math.abs(y-point[1])<.001)).filter(Boolean);
  const xs=path.map(([x])=>x);
  assert.ok(xs.length>=15 && xs[0]-xs.at(-1)>5,JSON.stringify(xs));
  assert.ok(xs.every((x,index)=>index===0||x<=xs[index-1]+.01),'Points must move monotonically left: '+JSON.stringify(xs));
  assert.ok(new Set(xs.map(x=>x.toFixed(2))).size>=10);
  const label=first.labels.find(label=>label.x>400&&label.x<700);
  assert.ok(label,'A time label must be visible near the center');
  const labelXs=frames.map(frame=>frame.labels.find(item=>item.text===label.text)?.x).filter(Number.isFinite);
  assert.ok(new Set(labelXs.map(x=>x.toFixed(2))).size>=10,'Time labels must move across intermediate frames');
  assert.ok(labelXs.every((x,index)=>index===0||x<=labelXs[index-1]+.01),'Time labels must move monotonically left');
  assert.ok(Math.abs((labelXs[0]-labelXs.at(-1))-(xs[0]-xs.at(-1)))<=1,'Time labels and measurements must move together');
  assert.ok(frames.every(frame=>{const x=frame.labels.find(item=>item.text===label.text)?.x;return x!==undefined&&frame.grids.some(grid=>Math.abs(grid-x)<=1); }),'Time labels must stay aligned with their grid lines');
  await page.getByRole('button',{name:'일시정지',exact:true}).click();
  const pausedCount=await page.evaluate(()=>window.motionFrames.length);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.motionFrames.length),pausedCount);
  await shot('live-paused');
  pass('live moves measurements, time labels and grid lines smoothly together',{frames:frames.length,duration:last.time-first.time,leftShift:xs[0]-xs.at(-1),axisShift:labelXs[0]-labelXs.at(-1)});
  await page.evaluate(()=>{window.motionFrames=[];});
  await page.getByRole('button',{name:'다시 시작',exact:true}).click();
  await page.waitForTimeout(4300);
  await page.getByRole('button',{name:'일시정지',exact:true}).click();
  const continuous=await page.evaluate(()=>window.motionFrames);
  assert.ok(continuous.length>120,'Automatic updates must keep painting across multiple samples');
  const jumps=continuous.slice(1).flatMap((frame,index)=>{
    const previous=continuous[index];
    const label=frame.labels.find(item=>item.x>350&&item.x<750&&previous.labels.some(prior=>prior.text===item.text));
    if(!label)return[];
    const prior=previous.labels.find(item=>item.text===label.text);
    return label.x-prior.x>.1?[{time:frame.time,dx:label.x-prior.x}]:[];
  });
  assert.deepEqual(jumps,[],'X-axis labels must never jump back to the initial domain when a new automatic sample arrives');
  pass('automatic samples preserve continuous axis position across four updates',{frames:continuous.length});
  const automaticCount=continuous.length;
  await page.getByRole('button',{name:'다시 시작',exact:true}).click();
  await page.getByRole('button',{name:'한 건 추가',exact:true}).click();
  await page.waitForTimeout(150);
  assert.ok(await page.evaluate(before=>window.motionFrames.length>before,automaticCount),'A new window transition must be running');
  await page.getByRole('button',{name:'일시정지',exact:true}).click();
  const frozen=await page.evaluate(()=>window.motionFrames.length);
  await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>window.motionFrames.length),frozen,'Pause must cancel the frame loop');
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(60);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(60);
  const restored=await page.evaluate(()=>window.motionFrames.length);
  await page.waitForTimeout(220);
  assert.equal(await page.evaluate(()=>window.motionFrames.length),restored,'Restoring a paused tab must not restart the frame loop');
  pass('pause freezes an in-flight window and stays paused after tab visibility changes',{});
  await page.getByRole('button',{name:'다시 시작',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.activeIntervals.size),1);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(60);
  assert.equal(await page.evaluate(()=>window.activeIntervals.size),0);
  const hiddenCount=await page.evaluate(()=>window.motionFrames.length);
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.motionFrames.length),hiddenCount);
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(60);
  assert.equal(await page.evaluate(()=>window.activeIntervals.size),1);
  await page.locator('.sidebar a[href*="sample=bar"]').first().click();
  await page.getByRole('heading',{name:'Column',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.activeIntervals.size),0);
  pass('pause, simulated visibility changes and route unmount clean up timers',{running:1,paused:0,hidden:0,unmounted:0});
  await page.emulateMedia({reducedMotion:'reduce'});
  await open('live');await page.getByRole('button',{name:'일시정지',exact:true}).click();
  await page.evaluate(()=>{window.motionFrames=[];});
  await page.getByRole('button',{name:'한 건 추가',exact:true}).click();await page.waitForTimeout(250);
  const reduced=await page.evaluate(()=>window.motionFrames.length);
  assert.ok(reduced>=1&&reduced<=3,`Reduced motion still animates: ${reduced}`);
  pass('reduced motion updates immediately',{draws:reduced});
  await page.getByRole('tab',{name:'데이터',exact:true}).click();
  assert.equal((await readChartData(page)).labels.length,30);
  await page.getByRole('tab',{name:'예제',exact:true}).click();
  await page.getByRole('slider',{name:'표시할 데이터 수',exact:true}).press('End');
  await page.getByRole('tab',{name:'데이터',exact:true}).click();
  assert.equal((await readChartData(page)).labels.length,60,'The guard measurement must not leak into accessible data');
  pass('accessible live data contains only the selected window without the guard measurement',{});
  await open('floating-bar');
  await page.getByRole('tab',{name:'데이터',exact:true}).click();
  assert.equal((await readChartData(page)).series.length,2);
  const before=await chartDataText(page);
  await page.getByRole('tab',{name:'예제',exact:true}).click();
  await page.getByRole('slider').press('End');
  await page.getByRole('tab',{name:'데이터',exact:true}).click();
  assert.notEqual(await chartDataText(page),before);
  pass('floating interval data exposes both ends and responds to controls',{});
  for(const id of ['stacked-groups','multi-series-pie']){
    await open(id);await page.getByRole('tab',{name:'데이터',exact:true}).click();
    const labels=(await readChartData(page)).series.map(series => series.label);assert.equal(new Set(labels).size,labels.length,id);
    await page.getByRole('tab',{name:'예제',exact:true}).click();
    const control=page.getByRole(id==='stacked-groups'?'switch':'slider');
    if(id==='stacked-groups')await control.uncheck();else await control.press('End');
    await page.getByRole('tab',{name:'데이터',exact:true}).click();assert.deepEqual((await readChartData(page)).series.map(series => series.label),labels);
  }
  pass('stack groups and multi-series pie retain distinct series after controls change',{});
  await open('bubble');await page.getByRole('tab',{name:'데이터',exact:true}).click();
  assert.equal((await readChartData(page)).series.length,4);
  assert.match((await readChartData(page)).series.map(series => series.label).join(' '),/\(r\)/);
  pass('bubble radii are available in the JSON data',{});
  for(const id of ['line-interpolation','stepped-line','point-style','line-style','axis-titles','chart-title','tooltip-mode','tooltip-position']){
    await open(id);const select=page.locator('.chart-controls [role=combobox]');
    const previous=await select.textContent();
    await select.click();
    const option=page.getByRole('option',{selected:false}).first();
    const selected=await option.textContent();
    assert.ok(selected?.length>0,id);
    await option.click();
    assert.equal(await select.textContent(),selected,id);
    assert.notEqual(await select.textContent(),previous,id);
  }
  pass('all eight native selection controls change mode',{});
  await open('programmatic-events');await page.getByRole('button',{name:'Point 선택',exact:true}).click();
  await page.getByRole('tab',{name:/^이벤트/}).click();
  const activationEvent=page.locator('.event-list details').filter({hasText:'activate'}).first();
  await activationEvent.locator('summary').click();
  assert.equal(await activationEvent.locator('pre').innerText(),'2');
  pass('external tooltip selection records the selected point',{});
  for(const id of ['bar','axis-stacks','live']){
    await open(id);
    for(const [width,height] of [[1280,900],[768,720]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(()=>{const main=document.querySelector('main'),plot=document.querySelector('.chart-canvas');return main.scrollHeight<=main.clientHeight+1&&plot.scrollHeight<=plot.clientHeight+1;});
      const fit=await page.locator('.chart-canvas').evaluate(element=>({height:element.getBoundingClientRect().height,overflow:element.scrollHeight-element.clientHeight}));
      assert.ok(fit.height>=200&&fit.overflow<=1,JSON.stringify({id,width,height,fit}));
    }
  }
  pass('Cartesian plots fit the available card height at desktop and tablet sizes',{});
  for(const id of ['sparkline','detail-chart']){
    await open(id);
    for(const [width,height] of [[1280,900],[768,720],[375,667]]){
      await page.setViewportSize({width,height});
      await page.waitForTimeout(120);
      const grid=await page.locator('.OwpDataGrid-viewport').evaluate(element=>({horizontal:element.scrollWidth-element.clientWidth,vertical:element.scrollHeight-element.clientHeight}));
      assert.ok(grid.horizontal<=1&&grid.vertical<=1,JSON.stringify({id,width,height,grid}));
    }
    if(id==='detail-chart'){
      const collapsed=await page.locator('.OwpDataGrid-root').evaluate(element=>element.getBoundingClientRect().height);
      assert.ok(collapsed<250,'Collapsed detail rows must not reserve an empty 460px grid');
      await page.locator('.OwpDataGrid-root button[aria-expanded="false"]').first().click();
      await page.locator('.chart-detail canvas').waitFor();
      await page.waitForTimeout(250);
      assert.ok(await page.locator('.OwpDataGrid-root').evaluate(element=>element.getBoundingClientRect().height)>collapsed+250);
      const expanded=await page.locator('.OwpDataGrid-viewport').evaluate(element=>element.scrollHeight-element.clientHeight);
      assert.ok(expanded<=1,'Expanded detail height must grow with its chart');
      await shot('detail-layout-expanded');
    }
  }
  pass('embedded chart grids use their content height without empty detail space or nested scrolling',{});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const id of ['pie','multi-series-pie','doughnut']){
    await open(id);
    for(const [width,height] of [[1280,900],[768,720],[375,667]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(180);
      const fit=await page.evaluate(()=>{const main=document.querySelector('main'),canvas=document.querySelector('.chart-preview canvas').getBoundingClientRect(),plot=document.querySelector('.chart-canvas').getBoundingClientRect();return{overflow:main.scrollHeight-main.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,height:plot.height,canvas:canvas.bottom,plot:plot.bottom};});
      assert.ok(fit.overflow<=1&&fit.horizontal<=1&&fit.canvas<=fit.plot+1&&fit.height>=160&&fit.height<=420,JSON.stringify({id,width,height,fit}));
      await shot(`${id}-${width}`);
    }
  }
  pass('all three radial pages fit desktop, tablet and short mobile viewports',{});
  await page.setViewportSize({width:1280,height:900});
  for(const id of ['stacked-groups','multi-series-pie']){
    await open(id);await page.getByRole('button',{name:'영어로 전환',exact:true}).click();
    await page.waitForFunction(()=>document.documentElement.lang==='en');
    assert.equal(await page.locator('main').evaluate(element=>/[가-힣]/.test(element.innerText)),false,id);
  }
  pass('updated multi-series examples remain fully translated',{});
  assert.deepEqual(errors,[]);
}finally{await writeFile(new URL('functional.json',output),JSON.stringify({results,errors},null,2));await browser.close();}
