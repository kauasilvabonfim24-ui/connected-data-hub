import { FormEvent, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'

export default function Configuracoes() {
  const { empresa, usuario, refreshEmpresa } = useAuth()
  const [nome, setNome] = useState(empresa?.nome ?? '')
  const [telefone, setTelefone] = useState(empresa?.telefone ?? '')
  const [whatsapp, setWhatsapp] = useState(empresa?.whatsapp_numero ?? '')
  const [segmento, setSegmento] = useState(empresa?.segmento ?? '')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!empresa?.id) return
    setSalvando(true)
    
    const { error } = await supabase
      .from('empresas')
      .update({ nome, telefone, whatsapp_numero: whatsapp, segmento })
      .eq('id', empresa.id)
    
    await refreshEmpresa()
    setSalvando(false)
    
    if (error) {
      toast.error(`Erro ao salvar configurações: ${error.message}`)
    } else {
      toast.success('Configurações updated!')
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">Dados da sua empresa e integração do WhatsApp.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <div>
          <label className="label">Nome da empresa</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div>
          <label className="label">Segmento</label>
          <input className="input" placeholder="Ex: eletricista, mecânico..." value={segmento} onChange={(e) => setSegmento(e.target.value)} />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div>
          <label className="label">Número do WhatsApp (atendimento por IA)</label>
          <input className="input" placeholder="+55 31 9xxxx-xxxx" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      <div className="card mt-5 p-5">
        <h3 className="font-display text-sm font-semibold text-ink">Conta</h3>
        <p className="mt-1 text-sm text-ink-muted">Logado como {usuario?.email}</p>
      </div>
    </div>
  )
}