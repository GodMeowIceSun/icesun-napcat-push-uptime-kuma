/// <reference types="vite/client" />
declare module 'napcat-plugin-debug-cli/vite' {
    import { Plugin } from 'vite';

    interface NapcatHmrPluginOptions {
        webui?: {
            distDir: string;
            targetDir: string;
        };
        wsUrl?: string;
        token?: string;
        enabled?: boolean;
    }

    export function napcatHmrPlugin(options?: NapcatHmrPluginOptions): Plugin;
}