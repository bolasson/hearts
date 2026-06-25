import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const srcPath = new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserSite = repositoryName ? repositoryName.indexOf('.github.io') === repositoryName.length - 10 : false;
const base = repositoryName && !isUserSite ? `/${repositoryName}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': srcPath,
    },
  },
});
