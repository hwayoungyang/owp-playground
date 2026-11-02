import { useEffect, useRef } from 'react';
import type { ExampleMetadata } from '../types/playground';
import type { packageIntroductions } from '../../playgrounds/introductions';
import { WorkspaceHeading } from './WorkspaceHeading';
import { FrameworkIntroduction } from './FrameworkIntroduction';

export function GettingStartedHeader({
  example,
  packageId,
}: {
  readonly example: ExampleMetadata;
  readonly packageId: keyof typeof packageIntroductions;
}) {
  const header = useRef<HTMLElement>(null);
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (target && header.current?.closest('.workspace')?.contains(target))
      target.scrollIntoView({ block: 'start' });
  }, [hash]);
  return (
    <header className="getting-started-header" ref={header}>
      <WorkspaceHeading
        example={{ ...example, description: '' }}
        packageTitle={`owp/${packageId}`}
        categoryLabel="문서"
      />
      <FrameworkIntroduction packageId={packageId} />
    </header>
  );
}
