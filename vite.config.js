import path from 'path';

export default {
  build: {
    outDir: 'public',
    sourcemap: true,
    minify: true,
    rollupOptions: {
      input: 'src/index.html',
      output: {
        format: 'iife',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/js/'), 
      },
    },
  },
};