-- CORREÇÃO: trigger de signup travando por causa do RLS (erro 500 no cadastro)
create or replace function handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nova_empresa_id uuid;
  plano_basico_id uuid;
begin
  -- desliga a checagem de RLS só dentro desta função,
  -- pois ela precisa criar registros antes do usuário existir
  set local row_security = off;

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
