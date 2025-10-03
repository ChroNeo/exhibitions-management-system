import { defineConfig, loadEnv, type ServerOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '0.0.0.0'
  const port = Number(env.FRONTEND_PORT ?? env.PORT ?? 5173)
  const hmrPort = Number(env.VITE_HMR_PORT ?? port)
  const watchInterval = Number(env.VITE_WATCH_INTERVAL ?? 300)

  const hmrOptions: ServerOptions['hmr'] = {
    port: hmrPort,
    clientPort: hmrPort,
  }

  const hmrHost = env.VITE_HMR_HOST || (env.HOST && env.HOST !== '0.0.0.0' ? env.HOST : undefined)
  if (hmrHost) {
    hmrOptions.host = hmrHost
  }

  const hmrProtocol = env.VITE_HMR_PROTOCOL
  if (hmrProtocol) {
    hmrOptions.protocol = hmrProtocol
  }

  return defineConfig({
    plugins: [react()],
    server: {
      host,
      port,
      watch: {
        usePolling: true,
        interval: watchInterval,
      },
      hmr: hmrOptions,
    },
  })
}
