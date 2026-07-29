import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Griddis',
      fileName: 'griddis',
      formats: ['es', 'cjs']
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
});
