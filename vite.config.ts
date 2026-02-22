import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GoeyToastVue',
      fileName: (format) => format === 'es' ? 'index.js' : 'index.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', 'motion', 'vue-sonner'],
      output: {
        globals: {
          vue: 'Vue',
          motion: 'Motion',
          'vue-sonner': 'VueSonner',
        },
        assetFileNames: () => 'index.css',
      },
    },
    sourcemap: true,
    minify: false,
  },
})
