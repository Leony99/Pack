package com.leonycosta.packapi.customer.address;

import com.leonycosta.packapi.customer.customer.Customer;
import com.leonycosta.packapi.customer.customer.CustomerService;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final CustomerService customerService;

    public List<AddressResponse> findByCustomer(UUID customerId) {
        customerService.findEntityById(customerId); // valida que o cliente existe
        return addressRepository.findByCustomerId(customerId).stream()
                .map(this::toResponse)
                .toList();
    }

    public AddressResponse findById(UUID customerId, UUID addressId) {
        return toResponse(findOrThrow(customerId, addressId));
    }

    public AddressResponse create(UUID customerId, AddressRequest request) {
        Customer customer = customerService.findEntityById(customerId);
        Address address = new Address();
        address.setCustomer(customer);
        address.setCep(request.getCep());
        address.setRua(request.getRua());
        address.setNumero(request.getNumero());
        address.setComplemento(request.getComplemento());
        address.setCidade(request.getCidade());
        address.setEstado(request.getEstado().toUpperCase());
        return toResponse(addressRepository.save(address));
    }

    public AddressResponse update(UUID customerId, UUID addressId, AddressRequest request) {
        Address address = findOrThrow(customerId, addressId);
        address.setCep(request.getCep());
        address.setRua(request.getRua());
        address.setNumero(request.getNumero());
        address.setComplemento(request.getComplemento());
        address.setCidade(request.getCidade());
        address.setEstado(request.getEstado().toUpperCase());
        return toResponse(addressRepository.save(address));
    }

    public void delete(UUID customerId, UUID addressId) {
        findOrThrow(customerId, addressId);
        addressRepository.deleteById(addressId);
    }

    // Usado pelo OrderService no checkout
    public Address findEntityById(UUID customerId, UUID addressId) {
        return findOrThrow(customerId, addressId);
    }

    private Address findOrThrow(UUID customerId, UUID addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Endereço", addressId));
        if (!address.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("Endereço não pertence ao cliente informado");
        }
        return address;
    }

    private AddressResponse toResponse(Address a) {
        return new AddressResponse(a.getId(), a.getCep(), a.getRua(), a.getNumero(),
                a.getComplemento(), a.getCidade(), a.getEstado());
    }
}
