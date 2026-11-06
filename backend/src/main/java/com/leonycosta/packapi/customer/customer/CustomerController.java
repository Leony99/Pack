package com.leonycosta.packapi.customer.customer;

import com.leonycosta.packapi.config.Pagina;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Clientes", description = "Listar exige CUSTOMER_READ. O cliente vê, altera e apaga só o próprio cadastro.")
@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @Operation(summary = "Lista os clientes em páginas")
    @GetMapping
    public Pagina<CustomerResponse> findAll(@RequestParam(defaultValue = "0") int pagina,
                                          @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        return customerService.findAll(pagina, tamanho);
    }

    @Operation(summary = "Busca um cliente")
    @GetMapping("/{id}")
    public CustomerResponse findById(@PathVariable UUID id) {
        return customerService.findById(id);
    }

    @Operation(summary = "Atualiza o cadastro do cliente")
    @PutMapping("/{id}")
    public CustomerResponse update(@PathVariable UUID id, @Valid @RequestBody CustomerRequest request) {
        return customerService.update(id, request);
    }

    @Operation(summary = "Apaga a conta (recusado se já tiver pedidos)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        customerService.delete(id);
    }
}
