import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/main.tsx',
                'resources/css/landing.css',
                'resources/css/command-center.css',
                'resources/css/stage-mode.css',
                'resources/js/app.js',
                'resources/js/soundboard.js',
                'resources/js/teleprompter.js',
                'resources/js/live-sync.js',
                'resources/js/calendar.js',
            ],
            refresh: [
                'resources/**',
                'routes/**',
                'public/index.html',
                'public/css/**',
                'public/js/**',
            ],
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    server: {
        host: '127.0.0.1',
        port: 5173,
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                            return 'vendor-react';
                        }
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        return 'vendor-libs';
                    }
                }
            }
        }
    }
});
