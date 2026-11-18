-- V1: a estrutura do banco como ela estava quando o projeto passou a usar o Flyway (antes, o Hibernate a
-- criava sozinho com ddl-auto=update). Gerada com pg_dump --schema-only de um banco criado pela versão
-- atual da API, e revisada.
-- No banco de produção, que já tinha tudo isto, ela NÃO roda: o Flyway marca o banco como "já na versão 1"
-- (baseline-on-migrate) e segue só com as migrações seguintes. Num banco vazio (testes, um banco novo), ela
-- cria tudo.
-- Nunca edite uma migração que já rodou: o Flyway confere o checksum e a API não sobe. Mudança nova = um
-- arquivo novo, V2__..., V3__...

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TABLE public.addresses (
    id uuid NOT NULL,
    apelido character varying(40),
    bairro character varying(255),
    cep character varying(255) NOT NULL,
    cidade character varying(255) NOT NULL,
    complemento character varying(255),
    estado character varying(255) NOT NULL,
    numero character varying(255) NOT NULL,
    principal boolean DEFAULT false NOT NULL,
    rua character varying(255) NOT NULL,
    customer_id uuid NOT NULL
);

CREATE TABLE public.cart_items (
    id uuid NOT NULL,
    quantidade integer NOT NULL,
    cart_id uuid NOT NULL,
    variant_id uuid NOT NULL
);

CREATE TABLE public.carts (
    id uuid NOT NULL,
    atualizado_em timestamp(6) without time zone NOT NULL,
    customer_id uuid NOT NULL
);

CREATE TABLE public.colors (
    id uuid NOT NULL,
    hex character varying(255) NOT NULL,
    nome character varying(255) NOT NULL
);

CREATE TABLE public.contato_mensagens (
    id uuid NOT NULL,
    assunto character varying(120),
    criado_em timestamp(6) without time zone NOT NULL,
    email character varying(254) NOT NULL,
    mensagem character varying(2000) NOT NULL,
    nome character varying(100) NOT NULL,
    status character varying(255) NOT NULL,
    CONSTRAINT contato_mensagens_status_check CHECK (((status)::text = ANY ((ARRAY['NOVA'::character varying, 'RESPONDIDA'::character varying])::text[])))
);

CREATE TABLE public.coupons (
    id uuid NOT NULL,
    codigo character varying(255) NOT NULL,
    desconto numeric(38,2) NOT NULL,
    tipo character varying(255) NOT NULL,
    validade timestamp(6) without time zone NOT NULL,
    CONSTRAINT coupons_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PERCENTUAL'::character varying, 'FIXO'::character varying])::text[])))
);

CREATE TABLE public.customers (
    id uuid NOT NULL,
    criado_em timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    telefone character varying(255) NOT NULL
);

CREATE TABLE public.inventory_movements (
    id uuid NOT NULL,
    data timestamp(6) without time zone NOT NULL,
    motivo character varying(255),
    quantidade integer NOT NULL,
    tipo_movimentacao character varying(255) NOT NULL,
    variant_sku character varying(255) NOT NULL,
    variant_id uuid,
    CONSTRAINT inventory_movements_tipo_movimentacao_check CHECK (((tipo_movimentacao)::text = ANY ((ARRAY['ENTRADA'::character varying, 'SAIDA'::character varying, 'DEVOLUCAO'::character varying, 'AJUSTE'::character varying])::text[])))
);

CREATE TABLE public.newsletter_inscritos (
    id uuid NOT NULL,
    ativo boolean NOT NULL,
    criado_em timestamp(6) without time zone NOT NULL,
    email character varying(254) NOT NULL
);

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    preco_unit numeric(38,2) NOT NULL,
    produto_nome character varying(255),
    quantidade integer NOT NULL,
    variant_sku character varying(255) NOT NULL,
    order_id uuid NOT NULL,
    variant_id uuid
);

CREATE TABLE public.orders (
    id uuid NOT NULL,
    criado_em timestamp(6) without time zone NOT NULL,
    endereco_bairro character varying(255),
    endereco_cep character varying(255) NOT NULL,
    endereco_cidade character varying(255) NOT NULL,
    endereco_complemento character varying(255),
    endereco_estado character varying(255) NOT NULL,
    endereco_numero character varying(255) NOT NULL,
    endereco_rua character varying(255) NOT NULL,
    frete_prazo_dias integer,
    frete_preco numeric(10,2),
    frete_tipo character varying(255),
    status character varying(255) NOT NULL,
    total numeric(38,2) NOT NULL,
    coupon_id uuid,
    customer_id uuid NOT NULL,
    CONSTRAINT orders_frete_tipo_check CHECK (((frete_tipo)::text = ANY ((ARRAY['PAC'::character varying, 'SEDEX'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['AGUARDANDO_PAGAMENTO'::character varying, 'PAGO'::character varying, 'EM_SEPARACAO'::character varying, 'ENVIADO'::character varying, 'ENTREGUE'::character varying, 'CANCELADO'::character varying, 'DEVOLVIDO'::character varying])::text[])))
);

CREATE TABLE public.payments (
    id uuid NOT NULL,
    metodo character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    valor numeric(38,2) NOT NULL,
    order_id uuid NOT NULL,
    CONSTRAINT payments_metodo_check CHECK (((metodo)::text = ANY ((ARRAY['PIX'::character varying, 'CARTAO_CREDITO'::character varying, 'CARTAO_DEBITO'::character varying, 'BOLETO'::character varying, 'OUTRO'::character varying])::text[]))),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PENDENTE'::character varying, 'APROVADO'::character varying, 'RECUSADO'::character varying, 'ESTORNADO'::character varying])::text[])))
);

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL
);

CREATE TABLE public.product_images (
    id uuid NOT NULL,
    ordem integer NOT NULL,
    url character varying(255) NOT NULL,
    product_id uuid NOT NULL
);

CREATE TABLE public.product_tag_link (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    tag_id uuid NOT NULL
);

CREATE TABLE public.product_tags (
    id uuid NOT NULL,
    filtro character varying(20),
    tag character varying(255) NOT NULL,
    CONSTRAINT product_tags_filtro_check CHECK (((filtro)::text = ANY ((ARRAY['ESTILO'::character varying, 'CATEGORIA'::character varying, 'COLECAO'::character varying])::text[])))
);

CREATE TABLE public.product_variants (
    id uuid NOT NULL,
    criado_em timestamp(6) without time zone,
    preco numeric(38,2),
    quant integer NOT NULL,
    sku character varying(255) NOT NULL,
    color_id uuid NOT NULL,
    product_id uuid NOT NULL,
    size_id uuid NOT NULL
);

CREATE TABLE public.products (
    id uuid NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    criado_em timestamp(6) without time zone NOT NULL,
    descricao character varying(2000),
    nome character varying(255) NOT NULL,
    preco numeric(38,2) NOT NULL,
    slug character varying(255)
);

CREATE TABLE public.role_permissions (
    id uuid NOT NULL,
    permission_id uuid NOT NULL,
    role_id uuid NOT NULL
);

CREATE TABLE public.roles (
    id uuid NOT NULL,
    nome character varying(255) NOT NULL
);

CREATE TABLE public.shipments (
    id uuid NOT NULL,
    codigo_rastreio character varying(255),
    entregue_em timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    transportadora character varying(255) NOT NULL,
    order_id uuid NOT NULL,
    CONSTRAINT shipments_status_check CHECK (((status)::text = ANY ((ARRAY['PREPARANDO'::character varying, 'DESPACHADO'::character varying, 'ENTREGUE'::character varying, 'DEVOLVIDO'::character varying])::text[])))
);

CREATE TABLE public.sizes (
    id uuid NOT NULL,
    label character varying(255) NOT NULL
);

CREATE TABLE public.staff (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    nome character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    role_id uuid NOT NULL
);

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT colors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.contato_mensagens
    ADD CONSTRAINT contato_mensagens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.newsletter_inscritos
    ADD CONSTRAINT newsletter_inscritos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_tag_link
    ADD CONSTRAINT product_tag_link_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT product_tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT uk4yk902pr62j0jvp47ey0rv2fb UNIQUE (label);

ALTER TABLE ONLY public.product_tags
    ADD CONSTRAINT uk5urwbjsgtuors6s29yxk33uum UNIQUE (tag);

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT uk7xq7p7jlaaotwefc21s2ecs55 UNIQUE (nome);

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT uk88sv4i13lo80s74ox7rsb5a2c UNIQUE (customer_id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT uk8vo36cen604as7etdfwmyjsxt UNIQUE (order_id);

ALTER TABLE ONLY public.product_tag_link
    ADD CONSTRAINT uk91b8pk3xpyn53d4xsq7chu9e6 UNIQUE (product_id, tag_id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT uk_cart_items_carrinho_variante UNIQUE (cart_id, variant_id);

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT ukcy44k8xy9t39038h90bvkuej6 UNIQUE (codigo);

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT ukhrhy2yghr8dampg1jtecuekvp UNIQUE (order_id);

ALTER TABLE ONLY public.colors
    ADD CONSTRAINT ukmsu1ohhhvrjlg6g0i32drhnjx UNIQUE (nome);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT ukostq1ec3toafnjok09y9l7dox UNIQUE (slug);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT ukpvctx4dbua9qh4p4s3gm3scrh UNIQUE (email);

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT ukq935p2d1pbjm39n0063ghnfgn UNIQUE (sku);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT ukrfbvkrffamfql7cjmen8v976v UNIQUE (email);

ALTER TABLE ONLY public.newsletter_inscritos
    ADD CONSTRAINT ukrirm3gglktkjnedvbr23hdlfh UNIQUE (email);

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT ukrmeycok7co1w8i62f7v9cswhj UNIQUE (nome);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT ukt43p6aampim70fxxnkid1mibj UNIQUE (role_id, permission_id);

CREATE INDEX idx_product_tag_link_tag_id ON public.product_tag_link USING btree (tag_id);

CREATE INDEX idx_products_criado_em ON public.products USING btree (criado_em);

CREATE INDEX idx_products_nome_busca_7456385f ON public.products USING gin (translate(lower((nome)::text), 'áàâãäéèêëíìîïóòôõöúùûüç'::text, 'aaaaaeeeeiiiiooooouuuuc'::text) public.gin_trgm_ops);

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk52v4o49rlyvhrcxntwrf7k79t FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fk5yyw1o0dor9gmxfra1dqvn4qa FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk81gagumt0r8y3rmudcgpbk42l FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT fk8ba3sryid5k8a9kidpkvqipyt FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fkbioxgbv59vetrxe0ejfubep1w FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkegdk29eiy7mdtefy5c7eirr6e FOREIGN KEY (permission_id) REFERENCES public.permissions(id);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT fkemq71edpbn9wsxnxncfn1algp FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT fkhrpf5e8dwasvdc5cticysrt2k FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.product_tag_link
    ADD CONSTRAINT fkj5pddo26d8losogg4mleptjws FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT fkm671w66r18c9w9a38i9ysxyh9 FOREIGN KEY (role_id) REFERENCES public.roles(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fkn1d1gkxckw648m2n2d5gx0yx5 FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fkn5fotdgk8d1xvo8nav9uv3muc FOREIGN KEY (role_id) REFERENCES public.roles(id);

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT fknps1p21p470pq59fdj0ddwnrs FOREIGN KEY (color_id) REFERENCES public.colors(id);

ALTER TABLE ONLY public.product_tag_link
    ADD CONSTRAINT fkoitu62g3ano3ppnybuapowe53 FOREIGN KEY (tag_id) REFERENCES public.product_tags(id);

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT fkosqitn4s405cynmhb87lkvuau FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT fkpcttvuq4mxppo8sxggjtn5i2c FOREIGN KEY (cart_id) REFERENCES public.carts(id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT fkpxtb8awmi0dk6smoh2vp1litg FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT fkqnq71xsohugpqwf3c9gxmsuy FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT fkrnt4wht95lxxplspltrg9681s FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT fkt7j608wes333gojuoh0f8l488 FOREIGN KEY (size_id) REFERENCES public.sizes(id);
