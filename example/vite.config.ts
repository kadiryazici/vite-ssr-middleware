import { defineConfig } from 'vite';
import VueJSX from '@vitejs/plugin-vue-jsx';
import SSR from 'vite-ssr/plugin';
// https://vitejs.dev/config/
export default defineConfig({
   plugins: [VueJSX(), SSR()]
});
