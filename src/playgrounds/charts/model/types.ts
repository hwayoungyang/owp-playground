export type ChartSnapshot = {
  readonly labels: readonly string[];
  readonly series: readonly {
    readonly label: string;
    readonly values: readonly (number | null)[];
  }[];
};
export type ChartExampleProps = {
  readonly initialPreset?: string;
  readonly onData?: (data: ChartSnapshot) => void;
  readonly onRecord?: (name: string, detail: string) => void;
};
export type ChartRecord = Record<string, string | number>;
