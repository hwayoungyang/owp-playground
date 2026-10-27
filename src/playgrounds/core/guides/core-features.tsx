import { useOwpTranslation } from '@owp/components/hooks';
import { PlaygroundLink } from '../../../shared/ui/PlaygroundLink';
import { coreCatalog, type CoreCatalogEntry } from '../catalog';
import { coreFeatureCoverage } from '../model/featureCoverage';
import { CoreGuideLayout } from './CoreGuideLayout';

export function CoreFeaturesGuide({
  example,
}: {
  readonly example: Extract<CoreCatalogEntry, { readonly kind: 'guide' }>;
}) {
  const { t, i18n } = useOwpTranslation();
  return (
    <CoreGuideLayout
      example={example}
      introduction="Core가 직접 구현한 기능을 역할별로 정리했습니다. 각 기능의 설정 방법과 기대효과를 확인하고 문서·실행 예제·공개 API로 이동할 수 있습니다."
      sections={coreFeatureCoverage.map((group) => ({
        id: `core-feature-${group.id}`,
        title: group.title,
      }))}
    >
      {coreFeatureCoverage.map((group) => (
        <section key={group.id} aria-labelledby={`core-feature-${group.id}`}>
          <h2 id={`core-feature-${group.id}`}>{t(group.title)}</h2>
          <p>{t(group.body)}</p>
          <ul className="core-feature-links">
            {group.samples.map((id) => {
              const sample = coreCatalog.find((entry) => entry.id === id);
              if (!sample) throw new RangeError(`Unknown Core feature example: ${id}`);
              return (
                <li key={id}>
                  <PlaygroundLink
                    href={`?${new URLSearchParams({ package: 'core', sample: id, lang: i18n.language })}`}
                  >
                    {t(sample.title)}
                  </PlaygroundLink>
                </li>
              );
            })}
          </ul>
          <details className="core-feature-details">
            <summary>{t('공개 API 목록')}</summary>
            <ul className="core-feature-apis">
              {group.api.map((name) => (
                <li key={name}>
                  <PlaygroundLink
                    href={`?${new URLSearchParams({ package: 'core', view: 'api', symbol: name.includes(':') ? name : `@owp/core:${name}`, lang: i18n.language })}`}
                  >
                    <code>{name}</code>
                  </PlaygroundLink>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ))}
    </CoreGuideLayout>
  );
}
