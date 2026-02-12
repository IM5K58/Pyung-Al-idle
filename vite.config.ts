import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html'),
          background: resolve(__dirname, 'src/background/index.ts'),
          content: resolve(__dirname, 'src/content/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
              return '[name].js';
            }
            return 'assets/[name]-[hash].js';
          },
        },
      },
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'public/manifest.json',
            dest: '.',
            transform: (contents) => {
              return contents
                .toString()
                .replace('__CLIENT_ID__', env.VITE_GMAIL_CLIENT_ID || '');
            },
          },
        ],
      }),
    ],
  };
});
