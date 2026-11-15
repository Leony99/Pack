// Configuração do Vite: servidor de desenvolvimento e build de produção.
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  // Cada modo lê o seu .env: dev → .env.development (API local), build → .env.production (API no
  // Cloud Run), dev:demo → .env.demo (sem API). O Vite só passa ao código as variáveis VITE_; o
  // PACK_API_URL é do servidor: no dev, vai para o process.env; no build, fica gravado só no código
  // do servidor (__PACK_API_URL__), e a variável PACK_API_URL da hospedagem, se existir, vale mais.
  const env = loadEnv(mode, process.cwd(), "");
  if (env["PACK_API_URL"]) process.env["PACK_API_URL"] ??= env["PACK_API_URL"];

  return {
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
    // só o src/lib/api/server/http.ts usa: o navegador não recebe esse valor
    define: { __PACK_API_URL__: JSON.stringify(env["PACK_API_URL"] ?? "") },
    // 3000, e não 8080: a 8080 é a porta da Pack API local (docker compose)
    server: { host: "::", port: 3000 },
  };
});
