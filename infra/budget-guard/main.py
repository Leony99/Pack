# Disjuntor de custos da Pack.
#
# O orçamento do Google Cloud manda avisos (vários por dia) para o tópico "budget-alerts" do Pub/Sub,
# e o Google chama esta função a cada aviso. Quando o gasto do mês chega ao valor do orçamento,
# a função tira o acesso público da API: ela continua existindo, mas passa a responder 403.
# Nada é apagado. Para liberar de novo: infra/gcp/religar-api.sh
#
# Exemplo de aviso recebido (dentro de message.data, em base64):
#   {"budgetDisplayName": "pack", "costAmount": 5.12, "budgetAmount": 5.0, "currencyCode": "BRL", ...}

import base64
import json
import os

import functions_framework
from google.cloud import run_v2

# projects/<projeto>/locations/<região>/services/<serviço>, definido no deploy da função
SERVICO = os.environ["SERVICO"]
PAPEL_PUBLICO = "roles/run.invoker"
QUALQUER_PESSOA = "allUsers"


@functions_framework.cloud_event
def disjuntor(evento):
    aviso = json.loads(base64.b64decode(evento.data["message"]["data"]))
    gasto = aviso["costAmount"]
    limite = aviso["budgetAmount"]
    moeda = aviso.get("currencyCode", "")

    if gasto < limite:
        print(f"Gasto {gasto} de {limite} {moeda}: dentro do orçamento, nada a fazer.")
        return

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
        print(f"Gasto {gasto} de {limite} {moeda}: a API já estava fora do ar.")
        return

    cliente.set_iam_policy(request={"resource": SERVICO, "policy": politica})
    print(f"Gasto {gasto} de {limite} {moeda}: orçamento estourado, acesso público da API REMOVIDO.")
