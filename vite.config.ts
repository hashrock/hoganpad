import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages（/hoganpad/）など、どのパスに置いても動くよう相対パスで出力する
  base: './',
  plugins: [react()],
})
