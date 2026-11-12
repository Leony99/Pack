// Configuração dos testes (Vitest). É separada do vite.config.ts para os testes não carregarem
// o servidor do TanStack Start: eles só precisam do atalho "@" para a pasta src.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
