module.exports = {
  presets: [require('@owp/tailwind-config')],
  content: [],
  theme: {
    extend: {
      colors: {
        'pg-surface': 'var(--pg-shell-surface)',
        'pg-subtle': 'var(--pg-subtle)',
        'pg-ink': 'var(--pg-shell-ink)',
        'pg-secondary': 'var(--pg-shell-secondary)',
        'pg-line': 'var(--pg-shell-line)',
      },
      spacing: {
        panel: '24px',
        control: '16px',
        field: '8px',
      },
      borderRadius: {
        panel: 'var(--pg-shell-panel-radius)',
      },
      fontFamily: {
        ui: ['var(--font-ui)'],
        code: ['var(--font-mono)'],
      },
    },
  },
};
