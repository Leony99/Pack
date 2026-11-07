package com.leonycosta.packapi.customer.customer;

import org.springframework.data.domain.Sort;
import com.leonycosta.packapi.config.Pagina;
import com.leonycosta.packapi.cart.cart.Cart;
import com.leonycosta.packapi.cart.cart.CartRepository;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.order.order.OrderRepository;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;

    public Pagina<CustomerResponse> findAll(int pagina, int tamanho) {
        Sort ordem = Sort.by("nome", "id");
        return Pagina.de(customerRepository.findAll(Pagina.pedido(pagina, tamanho, ordem)).map(this::toResponse));
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

    // Sem pedidos, o cadastro é apagado de vez. Com pedidos, eles são histórico da loja (e documento fiscal),
    // então o cliente fica anonimizado: os dados pessoais somem, a conta não entra mais, e os pedidos ficam.
    @Transactional
    public void delete(UUID id) {
        Customer customer = findOrThrow(id);
        if (!orderRepository.existsByCustomerId(id)) {
            // CascadeType.ALL remove endereços e carrinho automaticamente
            customerRepository.delete(customer);
            return;
        }
        customer.setNome("Cliente removido");
        customer.setEmail("removido-" + id + "@removido.invalid");  // o e-mail original fica livre para um cadastro novo
        customer.setTelefone("-");
        customer.setSenhaHash("!");  // não é um hash BCrypt válido: nenhuma senha confere, então o login sempre falha
        customer.getEnderecos().clear();  // orphanRemoval apaga do banco (o pedido guarda a cópia do endereço)
        customer.setCart(null);           // idem; sem carrinho, um token antigo não consegue fechar pedido novo
        customerRepository.save(customer);
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
