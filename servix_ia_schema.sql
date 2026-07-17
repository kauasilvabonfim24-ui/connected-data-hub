-- ============================================================================
-- SERVIX IA — SCHEMA DE BANCO DE DADOS (Supabase / PostgreSQL)
-- Versão: 1.0 — Etapa 1: Estrutura Técnica
-- ============================================================================
-- Este script cria toda a estrutura multi-tenant do Servix IA.
-- Cada "empresa" (microempreendedor) é um tenant isolado por RLS.
-- Rode este script no SQL Editor do Supabase, no seu projeto.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSÕES
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ----------------------------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'profissional', 'atendente');
create type plano_nome as enum ('basico', 'profissional', 'premium_ia');
create type assinatura_status as enum ('trial', 'ativa', 'atrasada', 'cancelada');
create type agendamento_status as enum ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado', 'remarcado');
create type origem_agendamento as enum ('whatsapp', 'app', 'manual', 'ia_agente');
create type transacao_tipo as enum ('receita', 'despesa');
create type transacao_status as enum ('pendente', 'pago', 'atrasado', 'estornado');
create type forma_pagamento as enum ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'boleto', 'outro');
create type conversa_status as enum ('aberta', 'aguardando_ia', 'aguardando_humano', 'fechada');
create type mensagem_remetente as enum ('cliente', 'ia', 'atendente');
create type mensagem_tipo as enum ('texto', 'imagem', 'audio', 'localizacao', 'documento', 'botoes');
create type campanha_tipo as enum ('promocao', 'recuperacao_cliente', 'aniversario', 'pos_venda', 'personalizada');
create type campanha_status as enum ('rascunho', 'agendada', 'enviando', 'enviada', 'cancelada');
create type sugestao_status as enum ('pendente', 'aceita', 'recusada', 'expirada');
create type notificacao_tipo as enum (
  'novo_agendamento', 'novo_cliente', 'pagamento_recebido', 'servico_cancelado',
  'cliente_aguardando', 'avaliacao_recebida', 'campanha_finalizada', 'sugestao_ia'
);

-- ----------------------------------------------------------------------------
-- 2. PLANOS (catálogo fixo de assinatura)
-- ----------------------------------------------------------------------------
create table planos (
  id uuid primary key default gen_random_uuid(),
  nome plano_nome not null unique,
  preco_mensal numeric(10,2) not null,
  recursos jsonb not null default '{}'::jsonb, -- lista de features habilitadas
  criado_em timestamptz not null default now()
);

insert into planos (nome, preco_mensal, recursos) values
  ('basico', 39.90, '{"agenda": true, "clientes": true, "financeiro": true, "crm": true}'),
  ('profissional', 69.90, '{"agenda": true, "clientes": true, "financeiro": true, "crm": true, "whatsapp": true, "campanhas": true, "notificacoes": true}'),
  ('premium_ia', 99.90, '{"agenda": true, "clientes": true, "financeiro": true, "crm": true, "whatsapp": true, "campanhas": true, "notificacoes": true, "ia_empresarial": true, "ia_whatsapp": true, "ia_agente": true, "relatorios_inteligentes": true}');

-- ----------------------------------------------------------------------------
-- 3. EMPRESAS (tenant principal)
-- ----------------------------------------------------------------------------
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text, -- ex: eletricista, mecanico, tecnico_celular...
  telefone text,
  whatsapp_numero text, -- número usado na IA de atendimento
  cnpj_cpf text,
  endereco text,
  logo_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. ASSINATURAS
-- ----------------------------------------------------------------------------
create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  plano_id uuid not null references planos(id),
  status assinatura_status not null default 'trial',
  forma_pagamento forma_pagamento,
  inicio_em timestamptz not null default now(),
  fim_em timestamptz,
  criado_em timestamptz not null default now()
);

create index idx_assinaturas_empresa on assinaturas(empresa_id);

-- ----------------------------------------------------------------------------
-- 5. USUÁRIOS (vinculados ao auth.users do Supabase)
-- ----------------------------------------------------------------------------
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  email text not null,
  telefone text,
  role user_role not null default 'owner',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index idx_usuarios_empresa on usuarios(empresa_id);

-- Função auxiliar: retorna a empresa do usuário logado (usada nas policies)
create or replace function get_empresa_id()
returns uuid
language sql
security definer
stable
as $$
  select empresa_id from usuarios where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 6. CLIENTES (CRM)
-- ----------------------------------------------------------------------------
create table clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  telefone text not null,
  whatsapp_numero text,
  endereco text,
  email text,
  aniversario date,
  origem text, -- whatsapp, indicacao, app, manual
  observacoes text,
  total_gasto numeric(10,2) not null default 0,
  total_servicos int not null default 0,
  ultima_compra_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_clientes_empresa on clientes(empresa_id);
create index idx_clientes_telefone on clientes(empresa_id, telefone);

-- ----------------------------------------------------------------------------
-- 7. SERVIÇOS (catálogo do que a empresa oferece)
-- ----------------------------------------------------------------------------
create table servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  duracao_minutos int not null default 60,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index idx_servicos_empresa on servicos(empresa_id);

-- ----------------------------------------------------------------------------
-- 8. AGENDAMENTOS
-- ----------------------------------------------------------------------------
create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  servico_id uuid references servicos(id),
  profissional_id uuid references usuarios(id),
  status agendamento_status not null default 'agendado',
  origem origem_agendamento not null default 'manual',
  data_hora_inicio timestamptz not null,
  data_hora_fim timestamptz,
  valor numeric(10,2),
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_agendamentos_empresa on agendamentos(empresa_id);
create index idx_agendamentos_data on agendamentos(empresa_id, data_hora_inicio);
create index idx_agendamentos_cliente on agendamentos(cliente_id);

-- ----------------------------------------------------------------------------
-- 9. FINANCEIRO
-- ----------------------------------------------------------------------------
create table financeiro_transacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  agendamento_id uuid references agendamentos(id) on delete set null,
  tipo transacao_tipo not null,
  categoria text, -- ex: servico, material, aluguel, combustivel...
  descricao text,
  valor numeric(10,2) not null,
  forma_pagamento forma_pagamento,
  status transacao_status not null default 'pendente',
  data_transacao date not null default current_date,
  criado_em timestamptz not null default now()
);

create index idx_financeiro_empresa on financeiro_transacoes(empresa_id);
create index idx_financeiro_data on financeiro_transacoes(empresa_id, data_transacao);

-- ----------------------------------------------------------------------------
-- 10. AVALIAÇÕES
-- ----------------------------------------------------------------------------
create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  agendamento_id uuid references agendamentos(id) on delete set null,
  nota int not null check (nota between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);

create index idx_avaliacoes_empresa on avaliacoes(empresa_id);

-- ----------------------------------------------------------------------------
-- 11. WHATSAPP — CONVERSAS E MENSAGENS
-- ----------------------------------------------------------------------------
create table whatsapp_conversas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  numero_whatsapp text not null,
  status conversa_status not null default 'aberta',
  ultima_mensagem_em timestamptz default now(),
  criado_em timestamptz not null default now()
);

create index idx_conversas_empresa on whatsapp_conversas(empresa_id);
create index idx_conversas_numero on whatsapp_conversas(empresa_id, numero_whatsapp);

create table whatsapp_mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references whatsapp_conversas(id) on delete cascade,
  remetente mensagem_remetente not null,
  tipo mensagem_tipo not null default 'texto',
  conteudo text,
  midia_url text,
  enviado_em timestamptz not null default now()
);

create index idx_mensagens_conversa on whatsapp_mensagens(conversa_id);

-- ----------------------------------------------------------------------------
-- 12. MARKETING — CAMPANHAS
-- ----------------------------------------------------------------------------
create table campanhas_marketing (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  tipo campanha_tipo not null,
  mensagem text not null,
  publico_alvo jsonb default '{}'::jsonb, -- filtro: ex. {"inativos_dias": 90}
  status campanha_status not null default 'rascunho',
  criado_por_ia boolean not null default false,
  agendada_para timestamptz,
  enviada_em timestamptz,
  criado_em timestamptz not null default now()
);

create index idx_campanhas_empresa on campanhas_marketing(empresa_id);

create table campanha_envios (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references campanhas_marketing(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  status text not null default 'enviado', -- enviado, lido, respondido, falhou
  enviado_em timestamptz not null default now()
);

create index idx_campanha_envios_campanha on campanha_envios(campanha_id);

-- ----------------------------------------------------------------------------
-- 13. NOTIFICAÇÕES
-- ----------------------------------------------------------------------------
create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  tipo notificacao_tipo not null,
  titulo text not null,
  mensagem text,
  lida boolean not null default false,
  metadata jsonb default '{}'::jsonb, -- ex: {"cliente_id": "...", "valor": 250}
  criado_em timestamptz not null default now()
);

create index idx_notificacoes_empresa on notificacoes(empresa_id);
create index idx_notificacoes_usuario on notificacoes(usuario_id, lida);

-- ----------------------------------------------------------------------------
-- 14. IA EMPRESARIAL — LOG DE INTERAÇÕES
-- ----------------------------------------------------------------------------
create table ia_interacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete set null,
  pergunta text not null,
  resposta text,
  criado_em timestamptz not null default now()
);

create index idx_ia_interacoes_empresa on ia_interacoes(empresa_id);

-- ----------------------------------------------------------------------------
-- 15. IA AGENTE — SUGESTÕES PROATIVAS
-- ----------------------------------------------------------------------------
create table ia_sugestoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  titulo text not null,
  descricao text not null,
  acao jsonb default '{}'::jsonb, -- ação estruturada que a IA executaria se aceita
  status sugestao_status not null default 'pendente',
  criado_em timestamptz not null default now(),
  respondida_em timestamptz
);

create index idx_ia_sugestoes_empresa on ia_sugestoes(empresa_id, status);

-- ============================================================================
-- 16. TRIGGERS — atualizado_em automático
-- ============================================================================
create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_empresas_updated before update on empresas
  for each row execute function set_atualizado_em();
create trigger trg_clientes_updated before update on clientes
  for each row execute function set_atualizado_em();
create trigger trg_agendamentos_updated before update on agendamentos
  for each row execute function set_atualizado_em();

-- ============================================================================
-- 17. ROW LEVEL SECURITY (RLS) — isolamento total entre empresas
-- ============================================================================
alter table empresas enable row level security;
alter table assinaturas enable row level security;
alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table servicos enable row level security;
alter table agendamentos enable row level security;
alter table financeiro_transacoes enable row level security;
alter table avaliacoes enable row level security;
alter table whatsapp_conversas enable row level security;
alter table whatsapp_mensagens enable row level security;
alter table campanhas_marketing enable row level security;
alter table campanha_envios enable row level security;
alter table notificacoes enable row level security;
alter table ia_interacoes enable row level security;
alter table ia_sugestoes enable row level security;

-- Empresas: usuário só vê a própria empresa
create policy "empresas_isolamento" on empresas
  for all using (id = get_empresa_id());

-- Usuários: só vê colegas da mesma empresa
create policy "usuarios_isolamento" on usuarios
  for all using (empresa_id = get_empresa_id());

-- Assinaturas
create policy "assinaturas_isolamento" on assinaturas
  for all using (empresa_id = get_empresa_id());

-- Clientes
create policy "clientes_isolamento" on clientes
  for all using (empresa_id = get_empresa_id());

-- Serviços
create policy "servicos_isolamento" on servicos
  for all using (empresa_id = get_empresa_id());

-- Agendamentos
create policy "agendamentos_isolamento" on agendamentos
  for all using (empresa_id = get_empresa_id());

-- Financeiro
create policy "financeiro_isolamento" on financeiro_transacoes
  for all using (empresa_id = get_empresa_id());

-- Avaliações
create policy "avaliacoes_isolamento" on avaliacoes
  for all using (empresa_id = get_empresa_id());

-- WhatsApp conversas
create policy "conversas_isolamento" on whatsapp_conversas
  for all using (empresa_id = get_empresa_id());

-- WhatsApp mensagens (via conversa)
create policy "mensagens_isolamento" on whatsapp_mensagens
  for all using (
    conversa_id in (select id from whatsapp_conversas where empresa_id = get_empresa_id())
  );

-- Campanhas
create policy "campanhas_isolamento" on campanhas_marketing
  for all using (empresa_id = get_empresa_id());

-- Campanha envios (via campanha)
create policy "campanha_envios_isolamento" on campanha_envios
  for all using (
    campanha_id in (select id from campanhas_marketing where empresa_id = get_empresa_id())
  );

-- Notificações
create policy "notificacoes_isolamento" on notificacoes
  for all using (empresa_id = get_empresa_id());

-- IA interações
create policy "ia_interacoes_isolamento" on ia_interacoes
  for all using (empresa_id = get_empresa_id());

-- IA sugestões
create policy "ia_sugestoes_isolamento" on ia_sugestoes
  for all using (empresa_id = get_empresa_id());

-- ============================================================================
-- 18. TRIGGER: quando um novo usuário faz signup, criar empresa automaticamente
-- ============================================================================
-- Este trigger cria a empresa + vincula o usuário no primeiro cadastro (onboarding).
-- Ajuste conforme o fluxo de cadastro que você desenhar no Lovable.
create or replace function handle_new_user_signup()
returns trigger
language plpgsql
security definer
as $$
declare
  nova_empresa_id uuid;
  plano_basico_id uuid;
begin
  select id into plano_basico_id from planos where nome = 'basico';

  insert into empresas (nome)
  values (coalesce(new.raw_user_meta_data->>'empresa_nome', 'Minha Empresa'))
  returning id into nova_empresa_id;

  insert into usuarios (id, empresa_id, nome, email, role)
  values (new.id, nova_empresa_id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email, 'owner');

  insert into assinaturas (empresa_id, plano_id, status)
  values (nova_empresa_id, plano_basico_id, 'trial');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user_signup();

-- ============================================================================
-- FIM DO SCHEMA — Etapa 1 concluída.
-- Próximos passos sugeridos: Edge Functions (webhook WhatsApp, IA empresarial,
-- geração de relatórios), views agregadas para o Dashboard, e seed de dados
-- de teste.
-- ============================================================================
