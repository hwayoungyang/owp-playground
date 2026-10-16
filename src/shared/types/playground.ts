export type ExampleMetadata = {
  readonly id: string;
  readonly title: string;
  readonly package: string;
  readonly category: string;
  readonly description: string;
  readonly api: readonly string[];
  readonly source: string;
};

export type NavigationCategory = {
  readonly id: string;
  readonly label: string;
};
