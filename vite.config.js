import path from 'path';

export default {
  root: "src",
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    rollupOptions: {
      input: 'src/index.html',
      output: {
        format: 'iife',
      }
    }
  },
};