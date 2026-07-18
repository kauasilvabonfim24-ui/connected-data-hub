-- ============================================================================
-- SERVIX IA — Migração aditiva: PRODUTOS + REGRAS DO NEGÓCIO
-- ============================================================================
-- Esse script só ADICIONA coisas novas — não altera nem remove nada do que
-- já existe. Completa os 7 pilares que o agente do WhatsApp precisa consultar:
-- Clientes, Serviços, Produtos, Agenda, Financeiro, Marketing, Regras do Negócio.
-- Rode isso no SQL Editor do Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PRODUTOS (pilar 3) — igual a "servicos", mas para itens vendidos com estoque
-- ----------------------------------------------------------------------------
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  estoque int not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index if not exists idx_produtos_empresa on produtos(empresa_id);

alter table produtos enable row level security;

drop policy if exists "produtos_isolamento" on produtos;
create policy "produtos_isolamento" on produtos
  for all using (empresa_id = get_empresa_id());

-- ----------------------------------------------------------------------------
-- REGRAS DO NEGÓCIO (pilar 7) — configurável pelo empresário, sem precisar
-- de código novo por profissão. Guardado como JSON dentro da própria empresa.
-- ----------------------------------------------------------------------------
alter table empresas add column if not exists regras_negocio jsonb not null default '{
  "horario_funcionamento": "Segunda a sexta, das 08h às 18h",
  "atende_sabado": false,
  "atende_domingo": false,
  "intervalo_almoco": null,
  "sinal_antecipado_percentual": null,
  "formas_pagamento": ["PIX", "Cartão", "Dinheiro"],
  "realiza_entregas": false,
  "observacoes_gerais": []
}'::jsonb;

-- ============================================================================
-- FIM — nenhuma tabela existente foi alterada ou removida.
-- ============================================================================