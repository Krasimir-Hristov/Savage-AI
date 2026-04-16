import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/types/**',
        'src/app/globals.css',
        '**/*.d.ts',
      ],
    },
    server: {
      deps: {
        inline: [
          '@supabase/ssr',
          '@supabase/supabase-js',
          '@langchain/core',
          '@langchain/openai',
          '@langchain/community',
          '@langchain/langgraph',
          'langchain',
        ],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
