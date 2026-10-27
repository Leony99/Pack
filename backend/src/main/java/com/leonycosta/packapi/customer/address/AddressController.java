package com.leonycosta.packapi.customer.address;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public List<AddressResponse> findByCustomer(@PathVariable UUID customerId) {
        return addressService.findByCustomer(customerId);
    }

    @GetMapping("/{addressId}")
    public AddressResponse findById(@PathVariable UUID customerId, @PathVariable UUID addressId) {
        return addressService.findById(customerId, addressId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@PathVariable UUID customerId, @Valid @RequestBody AddressRequest request) {
        return addressService.create(customerId, request);
    }

    @PutMapping("/{addressId}")
    public AddressResponse update(@PathVariable UUID customerId, @PathVariable UUID addressId,
                                  @Valid @RequestBody AddressRequest request) {
        return addressService.update(customerId, addressId, request);
    }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID customerId, @PathVariable UUID addressId) {
        addressService.delete(customerId, addressId);
    }
}
