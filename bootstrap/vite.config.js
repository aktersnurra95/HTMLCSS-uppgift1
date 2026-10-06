import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses @import and legacy color functions.
        // Silence those warnings — they come from Bootstrap, not our code.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        quietDeps: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
})
