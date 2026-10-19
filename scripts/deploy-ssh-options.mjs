export function authenticationOptions(config, { interactive }) {
  return [
    '-o', 'StrictHostKeyChecking=yes',
    '-o', 'NumberOfPasswordPrompts=1',
    '-o', `ConnectTimeout=${Math.ceil(config.timeoutMs / 1000)}`,
    '-o', 'ConnectionAttempts=1',
    '-o', `BatchMode=${interactive ? 'no' : 'yes'}`,
  ];
}
