import { readFileSync } from 'node:fs';
import { knowledgePackages, completedPlaygroundPackages } from '../src/playgrounds/packages.ts';
import { packageIntroductions } from '../src/playgrounds/introductions.ts';
import { toReferenceStyle } from './korean-copy.mjs';

/** 시작 화면과 설치본의 공개 경로를 같은 버전의 MCP 가이드로 제공합니다. */
export const packageGuides = knowledgePackages
  .filter((entry) => !completedPlaygroundPackages.some((completed) => completed.id === entry.id))
  .map((entry) => {
    const manifest = JSON.parse(
      readFileSync(new URL(`../node_modules/${entry.name}/package.json`, import.meta.url), 'utf8'),
    );
    const imports = Object.keys(manifest.exports)
      .filter((key) => key !== './package.json')
      .map((key) => `\`${key === '.' ? entry.name : entry.name + key.slice(1)}\``);
    const peers = Object.entries(manifest.peerDependencies ?? {}).map(
      ([name, version]) => `\`${name}@${version}\``,
    );
    return {
      id: `${entry.name}:guide.setup`,
      packageId: entry.id,
      title: `${entry.name} 설치와 공개 API`,
      description: `${entry.id} ${entry.version} 설치·공개 import 경로·MCP 조회 안내.`,
      api: [],
      examples: entry.id === 'components' ? ['getting-started', 'number-field'] : [],
      sourcePath: 'knowledge/package-guides.mjs',
      body: toReferenceStyle(
        [
          packageIntroductions[entry.id].replaceAll('패키지입니다.', '패키지.'),
          `사내 레지스트리와 접근 권한을 설정한 프로젝트에서 \`pnpm add ${entry.name}@${entry.version}\`로 설치합니다. ${peers.length ? `peer dependency 지원 범위: ${peers.join(', ')}.` : '별도 peer dependency는 없습니다.'} 선택적 peer dependency와 정적 리소스 설정은 설치본의 package.json과 현재 버전 README를 함께 확인합니다.`,
          `설치본의 공개 경로: ${imports.join(', ')}. 실제 symbol의 import 경로, 타입과 옵션은 같은 버전의 get_api 응답과 공개 선언을 확인합니다.`,
          entry.id === 'components'
            ? 'Components는 시작하기와 컴포넌트·hook·유틸 실행 예제의 실제 소스를 함께 제공합니다. MUI 테마와 필요한 Provider 구성은 시작하기 예제에서 확인합니다.'
            : '이 패키지의 독립 실행 예제는 아직 제공하지 않습니다. 다른 패키지의 예제에서 함께 사용한 API는 해당 예제의 소유 패키지를 유지하며, 독립 예제로 간주하지 않습니다.',
          `list_packages로 ${entry.name} ${entry.version}의 제공 여부를 확인하고, search_knowledge·get_api·get_guide에 정확한 version과 같은 releaseId를 지정합니다. 요청 버전이나 자료가 없으면 다른 버전으로 대체하지 않고 설치본의 공개 타입과 README를 확인합니다.`,
        ].join('\n\n'),
      ),
    };
  });
