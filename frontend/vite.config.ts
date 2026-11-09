// Configuração do Vite: servidor de desenvolvimento e build de produção.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({
      // a entrada do servidor é o src/server.ts, que troca o erro de renderização pela página de erro 500
      server: { entry: "server" },
      // código de servidor (pastas server/ ou o pacote "server-only") não pode ir para o navegador
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // só no build: empacota o servidor para a Cloudflare (troque o preset para hospedar em outro lugar)
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
    react(),
  ],
  resolve: {
    // @/ é a pasta src (o mesmo atalho do tsconfig.json)
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    // uma cópia só do React e do TanStack Query, mesmo que alguma dependência traga a sua
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  // o lightningcss processa o CSS (é o que gera as classes do Tailwind como o site espera)
  css: { transformer: "lightningcss" },
  server: { host: "::", port: 8080 },
}));
