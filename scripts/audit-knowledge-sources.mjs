import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { sourceMap } from '../knowledge/source-map.mjs';

const publicSourceId = (file) => file.replace('si/hankum/skills/hankum-mes-', 'consumer/');
const publicHeading = (heading) => heading
  .replaceAll('한금', '참조 앱')
  .replaceAll('Hankum', 'Reference app')
  .replaceAll('HANKUM', 'REFERENCE APP')
  .replaceAll('hankum', 'reference-app')
  .replaceAll('소비앱', '앱');

export async function auditKnowledgeSources(roots) {
  const sources = [];
  for (const spec of sourceMap) {
    const text = await readFile(path.join(roots[spec.root], spec.file), 'utf8');
    let fenced = false;
    const sections = [];
    for (const [index, line] of text.split('\n').entries()) {
      if (/^\s*```/.test(line)) fenced = !fenced;
      if (fenced) continue;
      const heading = line.match(/^#{1,4}\s+(.+)/);
      if (!heading) continue;
      const workflow = spec.scope === 'workflow' || /회귀|검증|검사|작업 흐름|적용 확인|결과 보고/.test(heading[1]);
      sections.push({
        heading: publicHeading(heading[1]), line: index + 1,
        disposition: spec.scope === 'history' ? 'historical' : workflow ? 'development' : spec.scope === 'consumer' ? 'consumer-pattern' : 'mapped',
        guideIds: workflow || spec.scope === 'history' ? [] : spec.topics.map((topic) => `@owp/${spec.packageId}:guide.${topic}`),
        note: spec.scope === 'history' ? '과거 이전·검증 기록이며 현재 버전의 통과 근거로 사용하지 않습니다.' : workflow ? '개발·승인·테스트 절차는 원본에서 관리합니다.' : spec.scope === 'consumer' ? '업무별 코드·경로·조회 정책을 일반 패키지 계약으로 확장하지 않습니다.' : '공개 declaration 및 연결 예제와 대조한 사용 설명에 연결합니다.',
        ...spec.sectionOverrides?.[heading[1]],
      });
    }
    sources.push({ id: `${spec.root}/${publicSourceId(spec.file)}`, packageId: spec.packageId, sha256: createHash('sha256').update(text).digest('hex'), sections });
  }
  return { schemaVersion: 1, sources, corrections: [
    { source: 'framework/packages/owp-charts/docs/advanced-geometry.md', status: 'aligned-with-installed-version', original: 'CoreChart·ChartFrame의 boxPlot·treemap·heatmap 타입명', current: '설치된 @owp/charts 6.1.0의 declaration과 controller 등록에서 boxPlot·treemap·heatmap을 사용. 전용 Owp 컴포넌트도 native 타입을 사용하며 이전 owp* 타입명은 제거됨', apiId: '@owp/charts:CoreChartProps', evidence: ['@owp/charts/types', '@owp/charts/chartjs/register', 'packages/owp-charts/docs/advanced-geometry.md'] },
    { source: 'agents/consumer/datagrid/references/editing.md', status: 'superseded', original: 'Enter 확정 후 항상 현재 셀 유지', current: 'enterKeyAction의 기본값 nextEditableCell, stay는 명시적 설정', apiId: '@owp/datagrid:OwpDataGridProps.enterKeyAction', evidence: ['@owp/datagrid/types', 'packages/owp-datagrid/src/components/OwpDataGrid/OwpDataGrid.tsx', 'packages/owp-datagrid/test/dataGridTypes.test.mjs'] },
    { source: 'playground/src/playgrounds/charts/model/referenceCatalog.ts', status: 'corrected', original: 'Treemap 예제 API 목록 accessors', current: '실행 예제가 사용하는 data·style·formatter로 연결. accessors는 커스텀 입력 타입의 조건부 계약으로 API 문서에 유지', apiId: '@owp/charts:OwpTreemapChartProps.accessors', evidence: ['src/playgrounds/charts/examples/treemap.tsx', '@owp/charts/types'] },
    { source: 'playground/src/playgrounds/charts/catalog.ts', status: 'corrected', original: 'Box plot 예제의 datasetOptions가 일반 ChartSeriesConfig 설정에 연결', current: '실제 Box plot dataset의 공개 타입 BoxPlotDatasetOptions로 라벨과 연결 대상을 변경', apiId: '@owp/charts:BoxPlotDatasetOptions', evidence: ['src/playgrounds/charts/examples/box-plot.tsx', '@owp/charts/types'] },
  ] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const agents = process.argv.find((value) => value.startsWith('--agents='))?.slice(9);
  const framework = process.argv.find((value) => value.startsWith('--framework='))?.slice(12);
  if (!agents || !framework) throw new TypeError('원본 루트를 --agents=경로 --framework=경로로 지정하세요.');
  const audit = await auditKnowledgeSources({ agents, framework });
  const content = `${JSON.stringify(audit, null, 2)}\n`;
  const destination = new URL('../knowledge/source-audit.json', import.meta.url);
  if (process.argv.includes('--write')) await writeFile(destination, content);
  else if (!isDeepStrictEqual(JSON.parse(await readFile(destination, 'utf8')), audit)) throw new Error('스킬·문서 원본이 바뀌었습니다. 삭제·이름·계약과 가이드 연결을 재검토하세요.');
  console.log(`PASS knowledge sources: ${audit.sources.length} files, ${audit.sources.reduce((sum, source) => sum + source.sections.length, 0)} sections`);
}
