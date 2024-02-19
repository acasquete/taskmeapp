export default {
  root: "src",
  esbuild: {
    drop: ['console', 'debugger'],
  },
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