# Ferramentas externas da produção

Ferramentas que o projeto **precisa** para configurar e atualizar a produção, e como usá-las sem deixar nada instalado no computador.

## gcloud (Google Cloud CLI)

**O que é:** a ferramenta de linha de comando do Google Cloud. Cria e configura recursos (serviços, permissões, segredos, orçamento) sem precisar clicar no console.

**Para que o projeto precisa dela:**

| Quando | Comando |
|---|---|
| Montar a produção do zero (num projeto novo do Google Cloud) | [`gcp/setup.sh`](gcp/setup.sh), etapa por etapa: `apis imagens segredos contas github api disjuntor agendador orcamento` |
| Religar a API depois que o disjuntor de custos a tirou do ar | [`gcp/religar-api.sh`](gcp/religar-api.sh) |
| Mudar uma configuração (memória, limites, variáveis, permissões, orçamento) | O comando `gcloud` daquela configuração; depois, atualizar o `setup.sh` para ele continuar sendo o registro de tudo |

O deploy do dia a dia **não** precisa do gcloud no computador: o GitHub Actions publica sozinho a cada envio para a `main` (ver [`ci-cd/README.md`](../ci-cd/README.md)).

### Jeito mais simples: Cloud Shell

O **Cloud Shell** (botão `>_` no topo do console do Google Cloud) já tem o gcloud instalado e logado. Nada vai para o computador. Para comandos curtos, como o do `religar-api.sh`, basta colá-los lá.

### Rodar os scripts no computador, sem instalar

O `setup.sh` lê o `.env.prod` da raiz do repositório, então ele roda melhor no computador. Para usar o gcloud sem instalá-lo:

1. **Baixar** o `.zip` oficial com Python embutido (`google-cloud-cli-windows-x86_64-bundled-python.zip`, por volta de 100 MB) e descompactar numa pasta temporária, fora do projeto. Não rode o instalador: assim nada entra no PATH do Windows, no registro nem em "Programas instalados".
2. **Isolar a configuração:** apontar a variável `CLOUDSDK_CONFIG` para uma pasta dentro da mesma pasta temporária. O login e as configurações ficam nela, e não em `%APPDATA%\gcloud`.
3. **Entrar:** `gcloud auth login`, com a conta do Google pelo navegador.
4. **Usar:** da raiz do repositório, `bash producao/gcp/setup.sh <etapa>` ou `bash producao/gcp/religar-api.sh`.
5. **Remover:** `gcloud auth revoke` para revogar o login e, depois, apagar a pasta temporária inteira (programa, configurações e credenciais).

### Usos até agora

Todos seguiram os passos acima e terminaram com a remoção do passo 5.

| Quando | O que foi feito |
|---|---|
| Montagem da produção | Todas as etapas do `setup.sh`. Testes: um aviso falso de gasto alto tirou a API do ar (403) e o `religar-api.sh` a devolveu (200) |
| Medidor da cota grátis | Etapas `agendador` e `orcamento`, e a função do disjuntor republicada. Testes: medição disparada à mão e corte com o `LIMITE` baixado por um instante |
| Revisão de segurança | O provedor do Workload Identity passou a aceitar só a `main` (`assertion.ref == 'refs/heads/main'`) |
