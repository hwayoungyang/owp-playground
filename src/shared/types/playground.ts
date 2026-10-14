export type SampleInfo = {
  readonly id: string;
  readonly title: string;
  readonly package: string;
  readonly category: string;
  readonly description: string;
  readonly api: readonly string[];
  readonly source: string;
};

export type SampleCategory = {
  readonly id: string;
  readonly label: string;
};
