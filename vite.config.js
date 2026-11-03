import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
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
    ],
    server: {
        host: '127.0.0.1',
        port: 5173,
    }
});
