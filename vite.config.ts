import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import rawPlugin from "vite-raw-plugin"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),
  rawPlugin({
    // Regex to include both .frag and .vert files
    fileRegex: /\.(vert|frag)$/,
  })],
  server: {
    watch: {
      usePolling: true,
    }
  },


})
