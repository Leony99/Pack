package com.leonycosta.packapi.customer;

import com.leonycosta.packapi.cart.Cart;
import com.leonycosta.packapi.cart.CartRepository;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;

    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    // Chamado pelo cadastro (AuthService.register), que já entrega a senha em hash
    public CustomerResponse create(CustomerRequest request, String senhaHash) {
        String email = request.getEmail().toLowerCase();
        if (customerRepository.existsByEmail(email)) {
            throw new ConflictException("Email já cadastrado: " + email);
        }
        Customer customer = new Customer();
        customer.setNome(request.getNome());
        customer.setEmail(email);
        customer.setTelefone(request.getTelefone());
        customer.setSenhaHash(senhaHash);
        customer.setCriadoEm(LocalDateTime.now());
        customer = customerRepository.save(customer);

        // Cria carrinho automaticamente junto com o cliente
        Cart cart = new Cart();
        cart.setCustomer(customer);
        cart.setAtualizadoEm(LocalDateTime.now());
        cartRepository.save(cart);

        return toResponse(customer);
    }

    public CustomerResponse update(UUID id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        String email = request.getEmail().toLowerCase();
        if (!customer.getEmail().equals(email) && customerRepository.existsByEmail(email)) {
            throw new ConflictException("Email já cadastrado: " + email);
        }
        customer.setNome(request.getNome());
        customer.setEmail(email);
        customer.setTelefone(request.getTelefone());
        return toResponse(customerRepository.save(customer));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        // CascadeType.ALL remove endereços e carrinho automaticamente
        customerRepository.deleteById(id);
    }

    public Customer findEntityById(UUID id) {
        return findOrThrow(id);
    }

    private Customer findOrThrow(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(c.getId(), c.getNome(), c.getEmail(), c.getTelefone(), c.getCriadoEm());
    }
}
