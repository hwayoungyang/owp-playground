import { defineConfig } from 'vite-plus/test/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx,js,mjs}'],
    server: {
      deps: {
        inline: [/@owp\//, /@rc-component\/slider/],
      },
    },
  },
});
