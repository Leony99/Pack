package com.leonycosta.packapi.customer.address;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.customer.customer.Customer;

@Entity
@Table(name = "addresses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private String cep;

    @Column(nullable = false)
    private String rua;

    @Column(nullable = false)
    private String numero;

    @Column
    private String complemento;

    // os endereços de antes desta coluna ficam sem bairro (o cliente completa ao editar)
    @Column
    private String bairro;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false)
    private String estado;

    // Nome que o cliente dá ao endereço (Casa, Trabalho), opcional
    @Column(length = 40)
    private String apelido;

    // O endereço que o checkout já traz marcado. Cada cliente com endereço tem exatamente um principal
    // (AddressService cuida disso ao criar, editar e apagar)
    @Column(nullable = false)
    @ColumnDefault("false")
    private boolean principal;
}