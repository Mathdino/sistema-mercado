<div align="center">
  <h1>🛒 Market Delivery App</h1>
  <p>Plataforma completa de delivery para mercados: app do cliente e painel administrativo.</p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black" />
    <img alt="React" src="https://img.shields.io/badge/React-19-61dafb" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6" />
    <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-4-38bdf8" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2d3748" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-8-4169e1" />
    <img alt="Zustand" src="https://img.shields.io/badge/Zustand-state-000000" />
    <img alt="Shadcn/UI" src="https://img.shields.io/badge/shadcn/ui-radix-111827" />
  </p>
</div>

---

## ✨ Destaques

- Experiência móvel moderna com interface limpa e responsiva
- Catálogo com categorias, produtos em destaque e promoções
- Carrinho persistente, checkout com Pix/Cartões/Dinheiro
- Cupons de desconto e Cashback global por pedido confirmado
- Painel Admin com gestão de pedidos, produtos, taxas e clientes
- API com Prisma para PostgreSQL e estado global via Zustand

---

## 🚀 Funcionalidades

### Cliente

- Navegar por categorias, produtos em destaque e promoções
- Pesquisa por nome/descrição ou por categoria
- Carrinho com ajuste de quantidades e cálculo de taxa de entrega
- Checkout com:
  - Endereço padrão do usuário
  - Métodos de pagamento: Pix, Crédito, Débito, Dinheiro
  - Observações ao pedido
  - Aplicação de cupom e desconto de cashback
- Acompanhamento de pedidos:
  - Lista e detalhes com status e forma de pagamento
- Perfil do cliente:
  - Edição de dados e endereço padrão com máscaras de CPF/telefone/CEP

Referências:

- [client/page.tsx](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/client/page.tsx)
- [Cart](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/client/cart/page.tsx)
- [Checkout](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/client/checkout/page.tsx)
- [Pedidos](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/client/orders/page.tsx)
- [Perfil](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/client/profile/page.tsx)

### Admin

- Dashboard e navegação colapsável
- Pedidos com paginação e normalização de status
- Produtos:
  - Listar, criar, editar, excluir
  - Promoções com preço original e prazo de término
  - Upload de imagens
- Categorias: CRUD com validações
- Taxas de entrega: FIXED com ativação/desativação
- Estabelecimento: dados e equipe com máscara de telefone e busca de CEP
- Clientes: listagem com endereços e contagem de pedidos
- Financeiro: receita, taxas, produtos vendidos e divisão por pagamento
- Cashback:
  - Global (percentual ativo) e por usuário
- Promo Banners: cards com imagem e vínculo de produto

Referências:

- [AdminLayout](file:///c:/Users/User/Desktop/outros/market-delivery-app/components/admin/admin-layout.tsx)
- [Pedidos](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/orders/page.tsx)
- [Produtos](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/products/page.tsx)
- [Criar Produto](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/products/create/page.tsx)
- [Taxas](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/fees/page.tsx)
- [Estabelecimento](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/establishment/page.tsx)
- [Clientes](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/users/page.tsx)
- [Financeiro](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/financial/page.tsx)
- [Promoções](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/promotions/page.tsx)
- [Cashback Admin](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/admin/cashback/page.tsx)
- [Banners de Promoção](file:///c:/Users/User/Desktop/outros/market-delivery-app/components/promotion-banner.tsx)

---

## 🧭 Fluxos Principais

### Autenticação

- Login de Admin por e-mail ou CPF especial:
  - Email: `admin@email.com` + senha `admin`
  - CPF: `00000000000` + senha `admin`
- Login de Cliente por CPF (com validação de 11 dígitos)
- JWT assinado e enviado em cookie httpOnly
- Referência: [login API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/auth/login/route.ts)

### Catálogo e Promoções

- Listagem, destaque e busca com filtros
- Expiração automática de promoções baseada em `promotionEndsAt`
- Referência: [products API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/products/route.ts)

### Carrinho e Checkout

- Estado persistido em `localStorage` via Zustand
- Cálculo de taxa ativa: FIXED
- Aplicação de cupom e cashback
- Criação de pedido com itens, endereço e pagamento
- Referências:
  - [store.ts](file:///c:/Users/User/Desktop/outros/market-delivery-app/lib/store.ts)
  - [fees/active API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/fees/active/route.ts)
  - [orders API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/orders/route.ts)
  - [cupom apply](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/client/coupon/apply/route.ts)
  - [cashback client](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/client/cashback/route.ts)

---

## 🧱 Arquitetura e Stack

- Next.js App Router com rotas cliente/admin/API (`/app`)
- UI com TailwindCSS 4 e shadcn/ui (Radix)
- Estado: Zustand com persistência
- Banco: PostgreSQL via Prisma
- Autenticação: JWT + NextAuth/Google (exemplo)
- Uploads: API de upload para `/public/uploads`

Arquivos chave:

- [package.json](file:///c:/Users/User/Desktop/outros/market-delivery-app/package.json)
- [schema.prisma](file:///c:/Users/User/Desktop/outros/market-delivery-app/prisma/schema.prisma)
- [components.json](file:///c:/Users/User/Desktop/outros/market-delivery-app/components.json)

---

## 📦 Estrutura de Dados (Prisma)

- Usuários (CLIENT/ADMIN) com endereços e pedidos
- Produtos com categorias, destaque, promoção e estoque
- Pedidos com itens, endereço de entrega, pagamento e cashback
- Taxa de Entrega (FIXED)
- Cashback Global e por Usuário
- Cupons e histórico de uso

Referência: [schema.prisma](file:///c:/Users/User/Desktop/outros/market-delivery-app/prisma/schema.prisma)

---

## ⚙️ Setup Rápido

1. Clonar e instalar dependências

```bash
npm install
```

2. Configurar `.env`

```bash
# Postgres (recomendado)
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB?schema=public"
```

Observação: há fallback de dev para arquivo `dev.db` via `prisma.config.ts`, mas o provider está como PostgreSQL — use Postgres em produção.

3. Gerar Prisma Client e migrar

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Popular dados de exemplo (opcional)

```bash
npm run prisma:seed
# ou endpoints:
# POST /api/seed-categories
# POST /api/seed-sample-data
```

5. Rodar em desenvolvimento

```bash
npm run dev
```

---

## 🧰 Scripts Úteis

- `dev`: inicia app Next.js
- `build`: compila para produção
- `start`: roda build
- `lint`: eslint
- `prisma:*`: generate, migrate, studio, seed

Fonte: [package.json](file:///c:/Users/User/Desktop/outros/market-delivery-app/package.json)

---

## 🔒 Segurança

- Cookies `httpOnly` para o token
- Validações de cupom (ativo, expiração, uso máximo, uso por usuário)
- Validação de endereço pertencente ao usuário no pedido
- Painéis Admin protegidos com guard e verificação de role

Referências:

- [orders API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/orders/route.ts)
- [admin fees API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/admin/fees/route.ts)
- [admin users API](file:///c:/Users/User/Desktop/outros/market-delivery-app/app/api/admin/users/route.ts)

---

## 🎯 Roadmap (sugestões)

- Entrega por distância (PER_KM) com cálculo por CEP
- Múltiplos endereços e seleção no checkout
- Notificações push e tempo real de status de pedido
- Integração com gateways de pagamento

---

## 🖼️ UI e Design

- shadcn/ui com estilo “new-york” e Radix
- Tema escuro/claro com next-themes
- Ícones `lucide-react`

Referências:

- [components.json](file:///c:/Users/User/Desktop/outros/market-delivery-app/components.json)
- [ThemeProvider](file:///c:/Users/User/Desktop/outros/market-delivery-app/components/theme-provider.tsx)

---

## 📚 Endpoints Principais

- Catálogo: `/api/products`, `/api/products/[id]`, `/api/homepage`
- Carrinho/Checkout: `/api/fees/active`, `/api/orders`
- Autenticação: `/api/auth/login`
- Admin:
  - Produtos: `/api/admin/products`, `/api/admin/products/[id]`
  - Categorias: `/api/admin/categories`, `/api/admin/categories/[id]`
  - Taxas: `/api/admin/fees`, `/api/admin/fees/[id]`
  - Clientes: `/api/admin/users`
  - Financeiro: `/api/admin/financial`
  - Cashback: `/api/admin/global-cashback`, `/api/admin/cashbacks`
  - Promoções: `/api/admin/promotions`, `/api/promotion-banners`

---

## 📝 Licença

Uso livre para fins educacionais e empresariais. Ajuste conforme sua necessidade.
