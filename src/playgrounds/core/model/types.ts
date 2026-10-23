export type CoreExampleProps = {
  readonly onRecord: (name: string, detail: string) => void;
  readonly onData: (data: Readonly<Record<string, unknown>>) => void;
};
