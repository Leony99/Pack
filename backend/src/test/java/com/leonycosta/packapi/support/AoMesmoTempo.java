package com.leonycosta.packapi.support;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

// Roda várias tarefas em threads separadas, todas largando no mesmo instante, e devolve os resultados.
// Serve para testar o que acontece quando dois clientes fazem a mesma coisa ao mesmo tempo.
public final class AoMesmoTempo {

    private AoMesmoTempo() {
    }

    public static <T> List<T> executar(List<Callable<T>> tarefas) throws Exception {
        CountDownLatch largada = new CountDownLatch(1);
        try (ExecutorService threads = Executors.newFixedThreadPool(tarefas.size())) {
            List<Future<T>> emAndamento = new ArrayList<>();
            for (Callable<T> tarefa : tarefas) {
                emAndamento.add(threads.submit(() -> {
                    largada.await(); // todas esperam aqui...
                    return tarefa.call();
                }));
            }
            largada.countDown();     // ...e saem juntas

            List<T> resultados = new ArrayList<>();
            for (Future<T> f : emAndamento) {
                // se alguma travar (deadlock), o teste falha em vez de ficar parado para sempre
                resultados.add(f.get(30, TimeUnit.SECONDS));
            }
            return resultados;
        }
    }
}
