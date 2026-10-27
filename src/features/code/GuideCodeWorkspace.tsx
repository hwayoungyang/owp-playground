import { useOwpTranslation } from '@owp/components/hooks';
import type { ExampleMetadata } from '../../shared/types/playground';
import { PlaygroundLink } from '../../shared/ui/PlaygroundLink';
import { WorkspaceHeading } from '../../shared/ui/WorkspaceHeading';
import { CodeViewer } from './CodeViewer';
import type { CodeLocation } from './code-location';

export function GuideCodeWorkspace({
  example,
  codeTarget,
}: {
  readonly example: ExampleMetadata;
  readonly codeTarget?: CodeLocation;
}) {
  const { t } = useOwpTranslation();
  const packageId = example.package.replace('@owp/', '');
  return (
    <section className="workspace" aria-label={t('가이드 코드')}>
      <WorkspaceHeading
        example={example}
        packageTitle={
          packageId === 'core' ? 'owp/core' : packageId === 'datagrid' ? 'OwpDataGrid' : 'OwpCharts'
        }
        categoryLabel="문서"
      />
      <p>
        <PlaygroundLink
          href={`?${new URLSearchParams({ package: packageId, sample: example.id })}`}
        >
          {t('가이드 보기')}
        </PlaygroundLink>
      </p>
      <CodeViewer example={example} codeTarget={codeTarget} requestedCode />
    </section>
  );
}
