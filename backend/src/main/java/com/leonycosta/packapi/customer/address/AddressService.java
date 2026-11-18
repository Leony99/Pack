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
        preencher(address, request);
        // o primeiro endereço do cliente é o principal, mesmo sem pedir
        boolean primeiro = addressRepository.findByCustomerId(customerId).isEmpty();
        if (request.querSerPrincipal() || primeiro) tornarPrincipal(customerId, address);
        return toResponse(addressRepository.save(address));
    }

    public AddressResponse update(UUID customerId, UUID addressId, AddressRequest request) {
        Address address = findOrThrow(customerId, addressId);
        preencher(address, request);
        // principal=false no principal atual não o desmarca: sempre há um (marque outro para trocar)
        if (request.querSerPrincipal()) tornarPrincipal(customerId, address);
        return toResponse(addressRepository.save(address));
    }

    public void delete(UUID customerId, UUID addressId) {
        Address address = findOrThrow(customerId, addressId);
        addressRepository.delete(address);
        addressRepository.flush();
        // apagou o principal: um dos que sobraram passa a ser
        if (address.isPrincipal()) {
            addressRepository.findByCustomerId(customerId).stream().findFirst().ifPresent(a -> {
                a.setPrincipal(true);
                addressRepository.save(a);
            });
        }
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

    private void preencher(Address address, AddressRequest request) {
        address.setCep(request.getCep());
        address.setRua(request.getRua());
        address.setNumero(request.getNumero());
        address.setComplemento(request.getComplemento());
        address.setBairro(request.getBairro());
        address.setCidade(request.getCidade());
        address.setEstado(request.getEstado().toUpperCase());
        address.setApelido(request.getApelido() == null || request.getApelido().isBlank()
                ? null : request.getApelido().strip());
    }

    // Só um principal por cliente: os outros deixam de ser
    private void tornarPrincipal(UUID customerId, Address novo) {
        for (Address outro : addressRepository.findByCustomerId(customerId)) {
            if (outro.isPrincipal() && !outro.getId().equals(novo.getId())) {
                outro.setPrincipal(false);
                addressRepository.save(outro);
            }
        }
        novo.setPrincipal(true);
    }

    private AddressResponse toResponse(Address a) {
        return new AddressResponse(a.getId(), a.getCep(), a.getRua(), a.getNumero(),
                a.getComplemento(), a.getBairro(), a.getCidade(), a.getEstado(), a.getApelido(), a.isPrincipal());
    }
}
