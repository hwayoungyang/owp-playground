import { defineConfig } from 'vite-plus/test/config';
import { componentsApiPlugin } from './scripts/components-api-plugin';
import { publicApiPlugin } from './scripts/public-api-plugin';

export default defineConfig({
  resolve: { dedupe: ['@owp/theme', 'i18next', 'react-i18next'] },
  plugins: [componentsApiPlugin(), publicApiPlugin()],
  test: {
    include: ['tests/**/*.test.{ts,tsx,js,mjs}'],
    server: {
      deps: {
        inline: [/@owp\//, /@rc-component\/slider/],
      },
    },
  },
});
