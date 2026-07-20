export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          data_hora_fim: string | null
          data_hora_inicio: string
          empresa_id: string
          id: string
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_agendamento"]
          profissional_id: string | null
          servico_id: string | null
          status: Database["public"]["Enums"]["agendamento_status"]
          valor: number | null
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          data_hora_fim?: string | null
          data_hora_inicio: string
          empresa_id: string
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_agendamento"]
          profissional_id?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          valor?: number | null
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          data_hora_fim?: string | null
          data_hora_inicio?: string
          empresa_id?: string
          id?: string
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_agendamento"]
          profissional_id?: string | null
          servico_id?: string | null
          status?: Database["public"]["Enums"]["agendamento_status"]
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          criado_em: string
          empresa_id: string
          fim_em: string | null
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          inicio_em: string
          plano_id: string
          status: Database["public"]["Enums"]["assinatura_status"]
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          fim_em?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          inicio_em?: string
          plano_id: string
          status?: Database["public"]["Enums"]["assinatura_status"]
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          fim_em?: string | null
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          inicio_em?: string
          plano_id?: string
          status?: Database["public"]["Enums"]["assinatura_status"]
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          agendamento_id: string | null
          cliente_id: string
          comentario: string | null
          criado_em: string
          empresa_id: string
          id: string
          nota: number
        }
        Insert: {
          agendamento_id?: string | null
          cliente_id: string
          comentario?: string | null
          criado_em?: string
          empresa_id: string
          id?: string
          nota: number
        }
        Update: {
          agendamento_id?: string | null
          cliente_id?: string
          comentario?: string | null
          criado_em?: string
          empresa_id?: string
          id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      campanha_envios: {
        Row: {
          campanha_id: string
          cliente_id: string
          enviado_em: string
          id: string
          status: string
        }
        Insert: {
          campanha_id: string
          cliente_id: string
          enviado_em?: string
          id?: string
          status?: string
        }
        Update: {
          campanha_id?: string
          cliente_id?: string
          enviado_em?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanha_envios_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_envios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_marketing: {
        Row: {
          agendada_para: string | null
          criado_em: string
          criado_por_ia: boolean
          empresa_id: string
          enviada_em: string | null
          id: string
          mensagem: string
          nome: string
          publico_alvo: Json | null
          status: Database["public"]["Enums"]["campanha_status"]
          tipo: Database["public"]["Enums"]["campanha_tipo"]
        }
        Insert: {
          agendada_para?: string | null
          criado_em?: string
          criado_por_ia?: boolean
          empresa_id: string
          enviada_em?: string | null
          id?: string
          mensagem: string
          nome: string
          publico_alvo?: Json | null
          status?: Database["public"]["Enums"]["campanha_status"]
          tipo: Database["public"]["Enums"]["campanha_tipo"]
        }
        Update: {
          agendada_para?: string | null
          criado_em?: string
          criado_por_ia?: boolean
          empresa_id?: string
          enviada_em?: string | null
          id?: string
          mensagem?: string
          nome?: string
          publico_alvo?: Json | null
          status?: Database["public"]["Enums"]["campanha_status"]
          tipo?: Database["public"]["Enums"]["campanha_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_marketing_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aniversario: string | null
          atualizado_em: string
          criado_em: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          telefone: string
          total_gasto: number
          total_servicos: number
          ultima_compra_em: string | null
          whatsapp_numero: string | null
        }
        Insert: {
          aniversario?: string | null
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          telefone: string
          total_gasto?: number
          total_servicos?: number
          ultima_compra_em?: string | null
          whatsapp_numero?: string | null
        }
        Update: {
          aniversario?: string | null
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string
          total_gasto?: number
          total_servicos?: number
          ultima_compra_em?: string | null
          whatsapp_numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          atualizado_em: string
          cnpj_cpf: string | null
          criado_em: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          regras_negocio: Json
          segmento: string | null
          telefone: string | null
          whatsapp_numero: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          cnpj_cpf?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          regras_negocio?: Json
          segmento?: string | null
          telefone?: string | null
          whatsapp_numero?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          cnpj_cpf?: string | null
          criado_em?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          regras_negocio?: Json
          segmento?: string | null
          telefone?: string | null
          whatsapp_numero?: string | null
        }
        Relationships: []
      }
      financeiro_transacoes: {
        Row: {
          agendamento_id: string | null
          categoria: string | null
          criado_em: string
          data_transacao: string
          descricao: string | null
          empresa_id: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"] | null
          id: string
          status: Database["public"]["Enums"]["transacao_status"]
          tipo: Database["public"]["Enums"]["transacao_tipo"]
          valor: number
        }
        Insert: {
          agendamento_id?: string | null
          categoria?: string | null
          criado_em?: string
          data_transacao?: string
          descricao?: string | null
          empresa_id: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          status?: Database["public"]["Enums"]["transacao_status"]
          tipo: Database["public"]["Enums"]["transacao_tipo"]
          valor: number
        }
        Update: {
          agendamento_id?: string | null
          categoria?: string | null
          criado_em?: string
          data_transacao?: string
          descricao?: string | null
          empresa_id?: string
          forma_pagamento?:
            | Database["public"]["Enums"]["forma_pagamento"]
            | null
          id?: string
          status?: Database["public"]["Enums"]["transacao_status"]
          tipo?: Database["public"]["Enums"]["transacao_tipo"]
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_transacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_transacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_interacoes: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          pergunta: string
          resposta: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id?: string
          pergunta: string
          resposta?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          pergunta?: string
          resposta?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ia_interacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_interacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_sugestoes: {
        Row: {
          acao: Json | null
          criado_em: string
          descricao: string
          empresa_id: string
          id: string
          respondida_em: string | null
          status: Database["public"]["Enums"]["sugestao_status"]
          titulo: string
        }
        Insert: {
          acao?: Json | null
          criado_em?: string
          descricao: string
          empresa_id: string
          id?: string
          respondida_em?: string | null
          status?: Database["public"]["Enums"]["sugestao_status"]
          titulo: string
        }
        Update: {
          acao?: Json | null
          criado_em?: string
          descricao?: string
          empresa_id?: string
          id?: string
          respondida_em?: string | null
          status?: Database["public"]["Enums"]["sugestao_status"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_sugestoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          empresa_id: string
          id: string
          lida: boolean
          mensagem: string | null
          metadata: Json | null
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string
          empresa_id: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          metadata?: Json | null
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string
          empresa_id?: string
          id?: string
          lida?: boolean
          mensagem?: string | null
          metadata?: Json | null
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          criado_em: string
          id: string
          nome: Database["public"]["Enums"]["plano_nome"]
          preco_mensal: number
          recursos: Json
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: Database["public"]["Enums"]["plano_nome"]
          preco_mensal: number
          recursos?: Json
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: Database["public"]["Enums"]["plano_nome"]
          preco_mensal?: number
          recursos?: Json
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          empresa_id: string
          estoque: number
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          empresa_id: string
          estoque?: number
          id?: string
          nome: string
          preco: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          empresa_id?: string
          estoque?: number
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          duracao_minutos: number
          empresa_id: string
          id: string
          nome: string
          preco: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          duracao_minutos?: number
          empresa_id: string
          id?: string
          nome: string
          preco: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          duracao_minutos?: number
          empresa_id?: string
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          criado_em: string
          email: string
          empresa_id: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          telefone: string | null
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          email: string
          empresa_id: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          email?: string
          empresa_id?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversas: {
        Row: {
          cliente_id: string | null
          contexto: Json
          criado_em: string
          empresa_id: string
          id: string
          numero_whatsapp: string
          status: Database["public"]["Enums"]["conversa_status"]
          ultima_mensagem_em: string | null
        }
        Insert: {
          cliente_id?: string | null
          contexto?: Json
          criado_em?: string
          empresa_id: string
          id?: string
          numero_whatsapp: string
          status?: Database["public"]["Enums"]["conversa_status"]
          ultima_mensagem_em?: string | null
        }
        Update: {
          cliente_id?: string | null
          contexto?: Json
          criado_em?: string
          empresa_id?: string
          id?: string
          numero_whatsapp?: string
          status?: Database["public"]["Enums"]["conversa_status"]
          ultima_mensagem_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instancias: {
        Row: {
          atualizado_em: string
          criado_em: string
          empresa_id: string
          id: string
          instance_name: string
          instance_token: string | null
          numero_conectado: string | null
          qrcode_base64: string | null
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          empresa_id: string
          id?: string
          instance_name: string
          instance_token?: string | null
          numero_conectado?: string | null
          qrcode_base64?: string | null
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          empresa_id?: string
          id?: string
          instance_name?: string
          instance_token?: string | null
          numero_conectado?: string | null
          qrcode_base64?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instancias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_mensagens: {
        Row: {
          conteudo: string | null
          conversa_id: string
          enviado_em: string
          id: string
          midia_url: string | null
          remetente: Database["public"]["Enums"]["mensagem_remetente"]
          tipo: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Insert: {
          conteudo?: string | null
          conversa_id: string
          enviado_em?: string
          id?: string
          midia_url?: string | null
          remetente: Database["public"]["Enums"]["mensagem_remetente"]
          tipo?: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Update: {
          conteudo?: string | null
          conversa_id?: string
          enviado_em?: string
          id?: string
          midia_url?: string | null
          remetente?: Database["public"]["Enums"]["mensagem_remetente"]
          tipo?: Database["public"]["Enums"]["mensagem_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_empresa_id: { Args: never; Returns: string }
    }
    Enums: {
      agendamento_status:
        | "agendado"
        | "confirmado"
        | "em_andamento"
        | "concluido"
        | "cancelado"
        | "remarcado"
      assinatura_status: "trial" | "ativa" | "atrasada" | "cancelada"
      campanha_status:
        | "rascunho"
        | "agendada"
        | "enviando"
        | "enviada"
        | "cancelada"
      campanha_tipo:
        | "promocao"
        | "recuperacao_cliente"
        | "aniversario"
        | "pos_venda"
        | "personalizada"
      conversa_status:
        | "aberta"
        | "aguardando_ia"
        | "aguardando_humano"
        | "fechada"
      forma_pagamento:
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "dinheiro"
        | "boleto"
        | "outro"
      mensagem_remetente: "cliente" | "ia" | "atendente"
      mensagem_tipo:
        | "texto"
        | "imagem"
        | "audio"
        | "localizacao"
        | "documento"
        | "botoes"
      notificacao_tipo:
        | "novo_agendamento"
        | "novo_cliente"
        | "pagamento_recebido"
        | "servico_cancelado"
        | "cliente_aguardando"
        | "avaliacao_recebida"
        | "campanha_finalizada"
        | "sugestao_ia"
      origem_agendamento: "whatsapp" | "app" | "manual" | "ia_agente"
      plano_nome: "basico" | "profissional" | "premium_ia"
      sugestao_status: "pendente" | "aceita" | "recusada" | "expirada"
      transacao_status: "pendente" | "pago" | "atrasado" | "estornado"
      transacao_tipo: "receita" | "despesa"
      user_role: "owner" | "admin" | "profissional" | "atendente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agendamento_status: [
        "agendado",
        "confirmado",
        "em_andamento",
        "concluido",
        "cancelado",
        "remarcado",
      ],
      assinatura_status: ["trial", "ativa", "atrasada", "cancelada"],
      campanha_status: [
        "rascunho",
        "agendada",
        "enviando",
        "enviada",
        "cancelada",
      ],
      campanha_tipo: [
        "promocao",
        "recuperacao_cliente",
        "aniversario",
        "pos_venda",
        "personalizada",
      ],
      conversa_status: [
        "aberta",
        "aguardando_ia",
        "aguardando_humano",
        "fechada",
      ],
      forma_pagamento: [
        "pix",
        "cartao_credito",
        "cartao_debito",
        "dinheiro",
        "boleto",
        "outro",
      ],
      mensagem_remetente: ["cliente", "ia", "atendente"],
      mensagem_tipo: [
        "texto",
        "imagem",
        "audio",
        "localizacao",
        "documento",
        "botoes",
      ],
      notificacao_tipo: [
        "novo_agendamento",
        "novo_cliente",
        "pagamento_recebido",
        "servico_cancelado",
        "cliente_aguardando",
        "avaliacao_recebida",
        "campanha_finalizada",
        "sugestao_ia",
      ],
      origem_agendamento: ["whatsapp", "app", "manual", "ia_agente"],
      plano_nome: ["basico", "profissional", "premium_ia"],
      sugestao_status: ["pendente", "aceita", "recusada", "expirada"],
      transacao_status: ["pendente", "pago", "atrasado", "estornado"],
      transacao_tipo: ["receita", "despesa"],
      user_role: ["owner", "admin", "profissional", "atendente"],
    },
  },
} as const
