import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '0.0.0.0'
  const port = Number(env.FRONTEND_PORT ?? env.PORT ?? 5173)

  return defineConfig({
    plugins: [react()],
    server: {
      host,
      port,
    },
  })
}
