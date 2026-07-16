// Tipos que espelham o schema Supabase (servix_ia_schema.sql)

export type AgendamentoStatus =
  | 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado' | 'remarcado'

export interface Empresa {
  id: string
  nome: string
  segmento: string | null
  telefone: string | null
  whatsapp_numero: string | null
  logo_url: string | null
  criado_em: string
}

export interface Usuario {
  id: string
  empresa_id: string
  nome: string
  email: string
  role: 'owner' | 'admin' | 'profissional' | 'atendente'
}

export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  telefone: string
  email: string | null
  endereco: string | null
  aniversario: string | null
  total_gasto: number
  total_servicos: number
  ultima_compra_em: string | null
  criado_em: string
}

export interface Servico {
  id: string
  empresa_id: string
  nome: string
  descricao: string | null
  preco: number
  duracao_minutos: number
  ativo: boolean
}

export interface Agendamento {
  id: string
  empresa_id: string
  cliente_id: string
  servico_id: string | null
  status: AgendamentoStatus
  data_hora_inicio: string
  data_hora_fim: string | null
  valor: number | null
  observacoes: string | null
  cliente?: Cliente
  servico?: Servico
}

export interface FinanceiroTransacao {
  id: string
  empresa_id: string
  tipo: 'receita' | 'despesa'
  categoria: string | null
  descricao: string | null
  valor: number
  status: 'pendente' | 'pago' | 'atrasado' | 'estornado'
  data_transacao: string
}

export interface WhatsappConversa {
  id: string
  empresa_id: string
  cliente_id: string | null
  numero_whatsapp: string
  status: 'aberta' | 'aguardando_ia' | 'aguardando_humano' | 'fechada'
  ultima_mensagem_em: string | null
  cliente?: Cliente
}

export interface WhatsappMensagem {
  id: string
  conversa_id: string
  remetente: 'cliente' | 'ia' | 'atendente'
  tipo: string
  conteudo: string | null
  enviado_em: string
}

export interface CampanhaMarketing {
  id: string
  empresa_id: string
  nome: string
  tipo: string
  mensagem: string
  status: 'rascunho' | 'agendada' | 'enviando' | 'enviada' | 'cancelada'
  criado_por_ia: boolean
  criado_em: string
}

export interface Notificacao {
  id: string
  empresa_id: string
  usuario_id: string | null
  tipo: string
  titulo: string
  mensagem: string | null
  lida: boolean
  criado_em: string
}

export interface IaInteracao {
  id: string
  empresa_id: string
  usuario_id: string | null
  pergunta: string
  resposta: string | null
  criado_em: string
}

export interface IaSugestao {
  id: string
  empresa_id: string
  titulo: string
  descricao: string
  status: 'pendente' | 'aceita' | 'recusada' | 'expirada'
  criado_em: string
}
