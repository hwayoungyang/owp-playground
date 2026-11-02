import type { ExampleMetadata } from '../../../shared/types/playground';

export type ComponentsExampleProps = {
  readonly onRecord: (name: string, detail: string) => void;
  readonly onData: (data: Readonly<Record<string, unknown>>) => void;
};

export type ComponentsExample = ExampleMetadata & {
  readonly kind: 'component';
  readonly layout?: 'fields';
  readonly category:
    | 'input-examples'
    | 'data-examples'
    | 'workflow-examples'
    | 'layout-examples'
    | 'components'
    | 'hooks'
    | 'utils';
};

export type ComponentsGuide = ExampleMetadata & {
  readonly kind: 'guide';
  readonly category: 'docs';
};

export type ComponentsCatalogEntry = ComponentsExample | ComponentsGuide;
