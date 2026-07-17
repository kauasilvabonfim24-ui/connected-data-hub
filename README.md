# Servix IA

**Seu funcionário digital 24 horas.**

SaaS para microempreendedores de serviços (eletricistas, mecânicos, técnicos, etc)
com agenda inteligente, CRM, financeiro, WhatsApp automatizado e IA empresarial.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (design tokens próprios — ver `tailwind.config.ts`)
- React Router
- Supabase (Auth + Postgres + RLS)
- PWA (instalável no celular/desktop)

## Estrutura do projeto

```
src/
  components/
    layout/     -> Sidebar, Topbar, AppLayout, badge da IA
    ui/         -> StatCard, Badge, EmptyState
  hooks/
    useAuth.tsx -> autenticação + contexto de empresa/usuário logado
  lib/
    supabase.ts -> client do Supabase
    utils.ts    -> formatação de moeda, data, saudação
  pages/
    auth/       -> Login, Cadastro
    Dashboard, Agenda, Clientes, Financeiro, Servicos,
    IAEmpresarial, WhatsApp, Marketing, Notificacoes, Configuracoes
  types/
    database.ts -> tipos espelhando o schema SQL do Supabase
```

## Como rodar localmente

```bash
npm install
cp .env.example .env      # depois preencha com sua URL e chave do Supabase
npm run dev
```

## Banco de dados

O schema SQL completo (`servix_ia_schema.sql`) foi entregue separadamente.
Rode ele no **SQL Editor** do seu projeto Supabase antes de usar o app —
ele cria todas as tabelas, os relacionamentos, o RLS (isolamento entre
empresas) e o trigger que cria a empresa automaticamente no cadastro.

Depois, pegue em **Project Settings > API** no Supabase:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public key` → `VITE_SUPABASE_ANON_KEY`

## Seu fluxo de trabalho (GitHub → Lovable → Dyad)

1. **Suba este projeto pro GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Servix IA - estrutura inicial"
   git branch -M main
   git remote add origin SEU_REPOSITORIO_AQUI
   git push -u origin main
   ```
2. **No Lovable:** conecte o repositório do GitHub (Import from GitHub).
   O Lovable vai reconhecer automaticamente que é um projeto Vite + React.
3. **Configure as variáveis de ambiente** no Lovable com os mesmos valores
   do seu `.env` (URL e chave do Supabase).
4. **Continue o desenvolvimento no Dyad** puxando o mesmo repositório.

## O que já está pronto

- Autenticação completa (login, cadastro, sessão persistente)
- Multi-tenant: cada empresa só vê seus próprios dados (via RLS)
- Layout com as 10 telas do plano original
- Dashboard com faturamento do dia, agenda, clientes inativos e sugestões da IA
- CRUD de leitura conectado ao Supabase em todas as telas (Agenda, Clientes,
  Financeiro, Serviços, WhatsApp, Marketing, Notificações)
- Estrutura de dados pronta para IA Empresarial (`ia_interacoes`) e
  IA Agente (`ia_sugestoes`)
- PWA configurado (instalável, com manifest e ícones)

## Próximos passos (Etapa 2 — não incluída neste pacote)

Essa entrega cobre o **app completo (frontend) + schema do banco**. O que
ainda falta pra ativar a "inteligência" de fato:

1. **Edge Functions no Supabase** para:
   - Webhook de recebimento de mensagens do WhatsApp (Meta Cloud API / Z-API)
   - IA Empresarial: transformar pergunta em consulta no banco + resposta em
     linguagem natural (integrando com a API da Anthropic, por exemplo)
   - IA Agente: rotina periódica que analisa os dados e cria sugestões em
     `ia_sugestoes`
   - Envio de campanhas de marketing em massa
2. **Formulários de criação/edição** (novo agendamento, novo cliente, novo
   serviço, novo lançamento financeiro) — hoje as telas já leem os dados,
   faltam os modais de criação.
3. Ligar o financeiro a um provedor de PIX/cartão real, se for o caso.

Posso seguir com qualquer um desses assim que você validar o app rodando.
