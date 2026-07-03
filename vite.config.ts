import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PemInjector',
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return `index.${format}.js`;
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'crypto',
        'fs',
        'path',
        'vite'
      ],
      output: {
        globals: {
          crypto: 'crypto',
          fs: 'fs',
          path: 'path',
          vite: 'vite'
        },
        preserveModules: false
      }
    },
    sourcemap: true,
    minify: false,
    target: 'node16'
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      outDir: 'dist',
      rollupTypes: true,
      insertTypesEntry: true
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/']
    }
  }
});