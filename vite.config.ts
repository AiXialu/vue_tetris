import { fileURLToPath, URL } from 'node:url'
import qiankun from 'vite-plugin-qiankun';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const useDevMode = true; 
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        qiankun('vue3App', {
            useDevMode
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        target: 'esnext',
        // Ensure UMD format for micro frontend compatibility
        lib: {
            entry: './src/main.ts',
            name: 'vue3App',
            formats: ['umd'],
            fileName: 'vue3-app'
        }
    },
    server: {
        cors: true,
        origin: 'http://localhost:5173' // Ensure this is correct
    }
});
