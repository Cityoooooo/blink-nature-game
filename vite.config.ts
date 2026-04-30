import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 与 GitHub 仓库路径一致：github.com/.../blink-nature-game */
const GITHUB_PAGES_BASE = '/blink-nature-game/'

export default defineConfig(({ command }) => ({
  // 开发时用根路径，避免「localhost 打不开」；仅 build 时带上子路径
  base: command === 'build' ? GITHUB_PAGES_BASE : '/',
  plugins: [react()],
  // 确保 public 目录下的 assets 能被正确访问
  publicDir: 'public',
  server: {
    // 允许 SharedArrayBuffer（MediaPipe GPU 推理需要）
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  build: {
    sourcemap: false,
  },
}))
