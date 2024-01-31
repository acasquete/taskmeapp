import path from 'path';

export default {
  root: "src",
  build: {
    outDir: '../public',
    emptyOutDir: true,
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