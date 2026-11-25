import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://markbuhayeu.store',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  integrations: [{
    name: 'local-component-library',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command === 'dev' || process.env.UI_KIT_BUILD === '1') {
          injectRoute({ pattern: '/__ui/', entrypoint: './src/dev/ui-kit.astro' });
          injectRoute({ pattern: '/__hero-qa/', entrypoint: './src/dev/hero-fixture.astro' });
        }
      },
    },
  }],
});
