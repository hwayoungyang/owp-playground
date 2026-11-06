import { Box, Link } from '@mui/material';
import { OwpTable } from '@owp/components';
import { useOwpTranslation } from '@owp/components/hooks';
import { CodeSnippet } from '../../../features/code/CodeSnippet';
import { GettingStartedHeader } from '../../../shared/ui/GettingStartedHeader';
import { McpGettingStarted } from '../../../features/mcp/McpGettingStarted';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import { packageGuideEntry } from '../../introductions';
import tailwindConfig from '../../../../tailwind.config.cjs?raw';
import tailwindStyles from '../../../app/styles/tailwind.css?raw';

const standardClasses = [
  ['grid / flex', 'Grid 또는 Flex 배치를 만듭니다.'],
  ['grid-cols-1 / md:grid-cols-3', '기본 1열에서 md 이상일 때 3열로 전환합니다.'],
  ['items-center / justify-center', '내용을 세로·가로 가운데에 정렬합니다.'],
  ['w-full / min-w-0', '가용 너비를 사용하고 좁은 화면에서 줄어들 수 있게 합니다.'],
] as const;
const owpClasses = [
  ['icon-size-*', '아이콘과 내부 SVG의 크기를 함께 지정합니다. 예: icon-size-20.'],
  ['text-10 / text-13 / text-16', 'OWP의 숫자형 글자 크기입니다. 각각 1rem·1.3rem·1.6rem입니다.'],
  [
    'rounded-2 / rounded-4 / rounded-6',
    'OWP의 숫자형 radius입니다. 각각 0.2rem·0.4rem·0.6rem입니다.',
  ],
] as const;
const presetValues = [
  ['p-16 / gap-16', 'OWP spacing의 16은 1.6rem입니다. Tailwind 기본값 4rem과 다릅니다.'],
  ['md:*', 'OWP의 md breakpoint는 960px입니다. Tailwind 기본값은 768px입니다.'],
  ['lg:*', 'OWP의 lg breakpoint는 1280px입니다. Tailwind 기본값은 1024px입니다.'],
] as const;
const playgroundClasses = [
  [
    'gap-field / gap-control / p-control / p-panel',
    'Playground 간격 별칭: field=8px, control=16px, panel=24px.',
  ],
  ['rounded-panel', 'Playground의 panel radius 변수를 사용합니다.'],
  [
    'bg-pg-surface / text-pg-ink / text-pg-secondary',
    'Playground의 화면·본문·보조 글자 색상 변수를 사용합니다.',
  ],
  ['dark:bg-pg-subtle', '앱의 data-color-mode가 dark일 때 배경색을 바꿉니다.'],
] as const;

function ClassTable({ rows }: { readonly rows: readonly (readonly [string, string])[] }) {
  const { t } = useOwpTranslation();
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <OwpTable
        sx={{ '& th, & td': { textAlign: 'left' } }}
        size="small"
        aria-label={t('class와 설정값')}
        headers={{ name: 'class', description: t('설명') }}
        rows={rows.map(([name, description]) => ({
          name: <code>{name}</code>,
          description: t(description),
        }))}
      />
    </Box>
  );
}

export function TailwindGettingStarted() {
  const { t, i18n } = useOwpTranslation();
  const example = packageGuideEntry({ id: 'tailwind-config', name: '@owp/tailwind-config' });
  return (
    <section className="workspace getting-started" aria-label={t('Tailwind 시작하기')}>
      <GettingStartedHeader example={example} packageId="tailwind-config" />
      <div className="guide-sections">
        <McpGettingStarted
          packageName="@owp/tailwind-config"
          version="4.0.0"
          headingId="tailwind-config-mcp"
        />
        <section aria-labelledby="tailwind-config-registry">
          <h2 id="tailwind-config-registry">{t('레지스트리 설정')}</h2>
          <p>{t('프로젝트 루트의 .npmrc에 사내 OWP 레지스트리 주소를 설정합니다.')}</p>
          <CodeSnippet label=".npmrc" code="@owp:registry=<OWP_REGISTRY_URL>" />
          <p className="guide-note">
            {t(
              '<OWP_REGISTRY_URL>에 OWP 패키지 레지스트리 주소를 입력합니다. 주소와 접근 권한은 Impix SmartBiz 팀에 문의해 주세요.',
            )}
          </p>
        </section>
        <section>
          <h2>{t('패키지 설치')}</h2>
          <p>
            {t(
              '기존 OWP 레지스트리 설정을 사용하는 프로젝트에서 아래 개발 의존성을 설치해 주세요.',
            )}
          </p>
          <CodeSnippet
            label={t('터미널')}
            code="pnpm add -D @owp/tailwind-config@4.0.0 tailwindcss@4.3.4 @tailwindcss/vite@4.3.4"
          />
          <p>{t('Vite의 기존 plugins를 유지하면서 tailwindcss()를 추가해 주세요.')}</p>
          <CodeSnippet
            label="vite.config.ts"
            code={
              "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport tailwindcss from '@tailwindcss/vite';\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});"
            }
          />
          <p>
            {t(
              '다음 CSS를 만들고 앱 entry에서 import해 주세요. OWP 공통 CSS는 Preflight를 제외하므로 기존 MUI 스타일과 함께 사용할 수 있습니다.',
            )}
          </p>
          <CodeSnippet label="src/app/styles/tailwind.css" language="css" code={tailwindStyles} />
          <CodeSnippet label="src/main.tsx" code={"import './app/styles/tailwind.css';"} />
          <p>
            {t(
              '아래 설정은 OWP 공통 preset에 Playground의 간격·색상 별칭을 추가합니다. 다른 앱에서는 해당 앱의 테마 변수에 맞춰 조정해 주세요.',
            )}
          </p>
          <CodeSnippet label="tailwind.config.cjs" code={tailwindConfig} />
        </section>
        <section>
          <h2>{t('Tailwind 기본 class')}</h2>
          <p>{t('기본 class의 사용법은 공식 Tailwind 문서에서 확인할 수 있습니다.')}</p>
          <ClassTable rows={standardClasses} />
          <Box component="ul" sx={{ display: 'grid', gap: 1, pl: 3 }}>
            <li>
              <Link
                href="https://tailwindcss.com/docs/installation/using-vite"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('공식 설치 가이드')}
              </Link>
            </li>
            <li>
              <Link
                href="https://tailwindcss.com/docs/styling-with-utility-classes"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('유틸리티 class 사용법')}
              </Link>
            </li>
            <li>
              <Link
                href="https://tailwindcss.com/docs/responsive-design"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('반응형 배치')}
              </Link>
            </li>
            <li>
              <Link
                href="https://tailwindcss.com/docs/dark-mode"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('다크 모드')}
              </Link>
            </li>
          </Box>
        </section>
        <section>
          <h2>{t('OWP 확장 class')}</h2>
          <p>
            {t(
              '@owp/tailwind-config 4.0.0의 공통 preset과 icon-size plugin에서 제공하는 확장입니다.',
            )}
          </p>
          <ClassTable rows={owpClasses} />
          <h3>{t('OWP preset에서 값이 달라지는 기본 class')}</h3>
          <ClassTable rows={presetValues} />
          <p>
            {t(
              'rem 단위는 앱의 html 글자 크기를 기준으로 계산합니다. 이 Playground의 1rem은 10px입니다.',
            )}
          </p>
        </section>
        <section>
          <h2>{t('Playground에서 추가한 class')}</h2>
          <p>
            {t(
              '다음 별칭은 위 tailwind.config.cjs에서 등록합니다. 다른 앱에서 사용하려면 해당 설정과 테마 변수도 함께 적용해 주세요.',
            )}
          </p>
          <ClassTable rows={playgroundClasses} />
          <PlaygroundLink
            href={
              '?package=tailwind-config&sample=utilities&lang=' + encodeURIComponent(i18n.language)
            }
          >
            {t('col1·col2·col3 배치 예제 열기')}
          </PlaygroundLink>
        </section>
      </div>
    </section>
  );
}
