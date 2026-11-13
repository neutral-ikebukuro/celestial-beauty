import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// 本番だけ厳しい CSP を入れる(外部への通信・読み込みを一切許さない)
const csp = (): Plugin => ({
  name: 'csp',
  apply: 'build',
  transformIndexHtml(html) {
    const policy = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
    ].join('; ');
    return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
  },
});

export default defineConfig({
  // 相対パスにして、GitHub Pages のどのサブパスでも動くようにする
  base: './',
  plugins: [react(), csp()],
  build: { target: 'es2020', sourcemap: false, assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  server: { port: 5188, host: '127.0.0.1' },
  preview: { port: 5189, host: '127.0.0.1' },
});
