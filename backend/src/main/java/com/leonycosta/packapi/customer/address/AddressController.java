package com.leonycosta.packapi.customer.address;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Endereços", description = "Endereços do cliente. Só o próprio cliente altera; funcionário com CUSTOMER_READ consulta.")
@RestController
@RequestMapping("/api/v1/customers/{customerId}/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @Operation(summary = "Lista os endereços do cliente")
    @GetMapping
    public List<AddressResponse> findByCustomer(@PathVariable UUID customerId) {
        return addressService.findByCustomer(customerId);
    }

    @Operation(summary = "Busca um endereço do cliente")
    @GetMapping("/{addressId}")
    public AddressResponse findById(@PathVariable UUID customerId, @PathVariable UUID addressId) {
        return addressService.findById(customerId, addressId);
    }

    @Operation(summary = "Cadastra um endereço")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@PathVariable UUID customerId, @Valid @RequestBody AddressRequest request) {
        return addressService.create(customerId, request);
    }

    @Operation(summary = "Atualiza um endereço")
    @PutMapping("/{addressId}")
    public AddressResponse update(@PathVariable UUID customerId, @PathVariable UUID addressId,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(customerId, addressId, request);
    }

    @Operation(summary = "Apaga um endereço")
    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID customerId, @PathVariable UUID addressId) {
        addressService.delete(customerId, addressId);
    }
}
