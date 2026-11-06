# Disjuntor de custos da Pack.
#
# Tira o acesso público da API (ela passa a responder 403; nada é apagado) em dois casos:
#
#   1. Cota grátis quase no fim (a principal): de hora em hora o Cloud Scheduler publica
#      {"verificar": "cota"} no tópico "budget-alerts". A função soma o uso do Cloud Run no mês
#      (Cloud Monitoring) e desliga a API se CPU, memória ou requisições passarem de 85% da cota grátis.
#   2. Orçamento estourado (segunda camada): o orçamento do Google Cloud publica avisos no mesmo
#      tópico, e a função desliga a API se o gasto real (o que passou da cota) chegar ao limite.
#
# Para liberar de novo: producao/gcp/religar-api.sh

import base64
import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import functions_framework
from google.cloud import monitoring_v3, run_v2

PROJETO = os.environ["PROJETO"]
# projects/<projeto>/locations/<região>/services/<serviço>
SERVICO = os.environ["SERVICO"]
PAPEL_PUBLICO = "roles/run.invoker"
QUALQUER_PESSOA = "allUsers"

# desliga em 85% da cota grátis (a variável LIMITE permite outro valor, por exemplo para testar)
LIMITE = float(os.environ.get("LIMITE", "0.85"))

# Cota grátis mensal do Cloud Run (cobrança por requisição). O Google a aplica como desconto em
# dinheiro pelo preço Tier 1; São Paulo é Tier 2 (CPU e memória 1,4x mais caras), então ela cobre
# menos segundos aqui: a cota em segundos é dividida por 1,4.
FATOR_TIER2 = 1.4
COTA_VCPU_S = 180_000 / FATOR_TIER2
COTA_GIB_S = 360_000 / FATOR_TIER2
COTA_REQUISICOES = 2_000_000

# Tamanho das instâncias da API (o mesmo do setup.sh). O tempo de instância de todos os serviços
# do projeto é contado com esse tamanho: a função do disjuntor, bem menor, entra a mais (conta a favor).
VCPU = 1
GIB = 1


@functions_framework.cloud_event
def disjuntor(evento):
    aviso = json.loads(base64.b64decode(evento.data["message"]["data"]))

    if aviso.get("verificar") == "cota":
        verificar_cota()
    elif "costAmount" in aviso:
        verificar_orcamento(aviso)
    else:
        print(f"Mensagem ignorada: {aviso}")


def verificar_orcamento(aviso):
    gasto, limite, moeda = aviso["costAmount"], aviso["budgetAmount"], aviso.get("currencyCode", "")
    if gasto < limite:
        print(f"Orçamento: gasto {gasto} de {limite} {moeda}, nada a fazer.")
        return
    desligar_api(f"orçamento estourado ({gasto} de {limite} {moeda})")


def verificar_cota():
    segundos = somar_no_mes("run.googleapis.com/container/billable_instance_time")
    requisicoes = somar_no_mes("run.googleapis.com/request_count")

    uso = {
        "CPU": segundos * VCPU / COTA_VCPU_S,
        "memória": segundos * GIB / COTA_GIB_S,
        "requisições": requisicoes / COTA_REQUISICOES,
    }
    resumo = ", ".join(f"{nome} {fracao:.1%}" for nome, fracao in uso.items())
    print(f"Cota grátis usada no mês: {resumo} (limite {LIMITE:.0%}).")

    estourados = [nome for nome, fracao in uso.items() if fracao >= LIMITE]
    if estourados:
        desligar_api(f"cota grátis em {LIMITE:.0%} ({', '.join(estourados)})")


def somar_no_mes(metrica):
    # O mês de faturamento do Google segue o horário do Pacífico
    agora = datetime.now(timezone.utc)
    inicio = agora.astimezone(ZoneInfo("America/Los_Angeles")).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    duracao = int((agora - inicio).total_seconds())

    cliente = monitoring_v3.MetricServiceClient()
    series = cliente.list_time_series(request={
        "name": f"projects/{PROJETO}",
        "filter": f'metric.type = "{metrica}" AND resource.type = "cloud_run_revision"',
        "interval": {"start_time": inicio, "end_time": agora},
        # um ponto só por série, somando o mês inteiro, e todas as séries somadas numa
        "aggregation": {
            "alignment_period": {"seconds": max(duracao, 60)},
            "per_series_aligner": monitoring_v3.Aggregation.Aligner.ALIGN_SUM,
            "cross_series_reducer": monitoring_v3.Aggregation.Reducer.REDUCE_SUM,
        },
    })
    total = 0.0
    for serie in series:
        for ponto in serie.points:
            total += ponto.value.double_value or ponto.value.int64_value
    return total


def desligar_api(motivo):
    cliente = run_v2.ServicesClient()
    politica = cliente.get_iam_policy(request={"resource": SERVICO})

    removido = False
    for i, regra in enumerate(politica.bindings):
        if regra.role == PAPEL_PUBLICO and QUALQUER_PESSOA in regra.members:
            regra.members.remove(QUALQUER_PESSOA)
            if not regra.members:  # o Google não aceita uma regra sem ninguém
                del politica.bindings[i]
            removido = True
            break

    if not removido:
        print(f"{motivo}: a API já estava fora do ar.")
        return

    cliente.set_iam_policy(request={"resource": SERVICO, "policy": politica})
    print(f"{motivo}: acesso público da API REMOVIDO.")
