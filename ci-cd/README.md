# CI/CD

Como cada mudança na Pack é testada (CI) e publicada (CD) automaticamente pelo **GitHub Actions**.
- O desenvolvimento local e os testes estão no [README principal](../README.md).
- Onde a API roda e como o custo fica em zero está em [`producao/`](../producao/README.md).

## Como está organizado

O GitHub só lê workflows de `.github/workflows/`, mas aceita **ações locais** (*composite actions*) em qualquer pasta do repositório. Por isso o CI/CD fica dividido em duas partes:

```
.github/workflows/ci.yml     ← porta de entrada: QUANDO rodar e EM QUE ORDEM
ci-cd/
├── README.md                ← este arquivo
├── ci-backend/action.yml    ← os passos do CI do backend
└── deploy/action.yml        ← os passos do CD (publicação no Google Cloud Run)
```

O workflow só baixa o código e chama as ações desta pasta:

```yaml
- uses: actions/checkout@v7       # baixa o código (as ações locais estão nele)
- uses: ./ci-cd/ci-backend        # roda os passos do CI
```

Quando o frontend chegar, ele ganha a sua ação (`ci-cd/ci-frontend/`) e um job a mais no workflow.

## O caminho de uma mudança

Cada job roda numa **máquina Linux temporária** do GitHub, criada para a execução e apagada no fim.

```
git push / pull request
        │
        ▼
GitHub lê .github/workflows/ci.yml
        │
        ▼
┌─ job "backend" (CI) ── ci-cd/ci-backend ─┐   falhou → ✗ para aqui, nada é publicado
│ 1. instala o Java 21 (com cache)         │            (relatórios dos testes ficam
│ 2. ./mvnw test   (225 testes)            │             para download)
│ 3. docker build  (confere a imagem)      │
└────────────────┬─────────────────────────┘
                 │ passou, e é push na main?
                 ▼
┌─ job "deploy" (CD) ── ci-cd/deploy ──────┐
│ 1. entra no Google Cloud (sem senha)     │
│ 2. monta e envia a imagem                │──► Artifact Registry (São Paulo)
│ 3. publica no Cloud Run                  │──► nova revisão da API
└──────────────────────────────────────────┘
```

O resultado aparece:
- na aba [Actions](https://github.com/Leony99/Pack/actions), com o log de cada passo;
- como ✓ ou ✗ em cada commit;
- no selo do README principal.

## CI: integração contínua

**Quando:** a cada envio para a `main` e a cada pull request.

**Passos** ([`ci-backend/action.yml`](ci-backend/action.yml)):

1. **Instala o Java 21.** As dependências do Maven ficam em cache entre execuções, o que deixa as seguintes mais rápidas.
2. **Roda os 225 testes** (`./mvnw test`): unidade, integração e concorrência.
   - O Testcontainers sobe um PostgreSQL 18 descartável no Docker, que já vem instalado na máquina do GitHub.
   - Não há segredo envolvido: os testes definem a própria configuração e não dependem de `.env`.
3. **Monta a imagem Docker**, só para conferir que o [`Dockerfile`](../backend/Dockerfile) continua funcionando.

**Se algo falha:**
- a execução para ali, e o commit fica marcado com ✗;
- nada é publicado, e a versão no ar continua a anterior;
- os relatórios dos testes são guardados e podem ser baixados na página da execução;
- o GitHub avisa por e-mail.

Pull requests passam pelo CI, mas nunca seguem para o CD.

## CD: publicação contínua

**Quando:** só num envio para a `main` e só depois que o CI passou (`needs: backend`).

**Passos** ([`deploy/action.yml`](deploy/action.yml)):

1. **Entra no Google Cloud sem senha (Workload Identity Federation).**
   - O GitHub gera um **token temporário assinado** (OIDC), dizendo "esta execução é do repositório `Leony99/Pack`, na branch `main`". Para isso, o job tem a permissão `id-token: write`.
   - O Google confere a assinatura e **só aceita esse repositório, e só na `main`**. Um workflow rodando em outra branch ou num pull request não consegue entrar, mesmo sendo do mesmo repositório.
   - Em troca, devolve um acesso de poucos minutos para a conta de serviço `github-deploy`.
2. **Monta e envia a imagem.** `docker build` usa o mesmo `Dockerfile` do desenvolvimento, e `docker push` envia a imagem ao **Artifact Registry**, em São Paulo. A tag é o código do commit (`pack-api:<sha>`), então cada versão publicada aponta para o código exato que a gerou.
3. **Publica no Cloud Run.** A ação `deploy-cloudrun` cria uma **revisão** nova do serviço `pack-api`, e ela passa a receber todo o tráfego. A revisão anterior continua guardada, e dá para voltar a ela pelo console.

**Garantias:**
- **Nenhuma senha no GitHub:** o login é pelo token temporário. A conta `github-deploy` e a ligação com o repositório foram criadas pelo [`producao/gcp/setup.sh`](../producao/gcp/setup.sh) (etapas `contas` e `github`).
- **A conta de deploy pode pouco:** ela envia imagens e publica revisões, mas **não mexe em permissões**.
- **O deploy só troca a imagem:** memória, limites, variáveis, segredos e acesso público continuam como estão. Por isso um deploy nunca religa a API se o [disjuntor de custos](../producao/README.md#disjuntor-de-custos) a tiver desligado.
- **Um deploy por vez** (`concurrency`): dois envios seguidos não publicam ao mesmo tempo.

### Variáveis do GitHub

O workflow lê 4 **variáveis** do repositório (*Settings → Secrets and variables → Actions → Variables*) e as passa para a ação de deploy. Nenhuma é secreta: sozinhas, elas não dão acesso a nada.

| Variável | O que é |
|---|---|
| `GCP_PROJECT_ID` | O projeto do Google Cloud |
| `GCP_REGION` | `southamerica-east1` (São Paulo) |
| `GCP_WIF_PROVIDER` | O provedor que aceita os tokens do GitHub |
| `GCP_DEPLOY_SA` | A conta de serviço que o deploy assume |

## Ações usadas

| Ação | Onde | Para quê |
|---|---|---|
| `actions/checkout@v7` | workflow | Baixa o código, incluindo as ações locais desta pasta |
| `actions/setup-java@v6` | CI | Instala o Java 21 e guarda o cache do Maven |
| `actions/upload-artifact@v7` | CI | Guarda os relatórios dos testes quando algo falha |
| `google-github-actions/auth@v3` | CD | Login no Google Cloud com Workload Identity Federation |
| `google-github-actions/setup-gcloud@v3` | CD | Instala o gcloud na máquina do GitHub, só durante a execução |
| `google-github-actions/deploy-cloudrun@v3` | CD | Publica a imagem nova no serviço do Cloud Run |
