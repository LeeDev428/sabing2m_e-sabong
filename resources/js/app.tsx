import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { PermissionManager } from './utils/permissionManager';
import { Capacitor } from '@capacitor/core';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Request all permissions on app startup (only on native platform)
if (Capacitor.isNativePlatform()) {
    console.log('📱 Running on native platform - requesting permissions...');
    PermissionManager.requestAllPermissions().catch(error => {
        console.error('Failed to request permissions:', error);
    });
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
