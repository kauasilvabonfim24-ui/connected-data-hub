import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Usuario, Empresa } from "@/types/database";
import type { Session } from "@supabase/supabase-js";

interface AuthContextValue {
  session: Session | null;
  usuario: Usuario | null;
  empresa: Empresa | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    nome: string,
    empresaNome: string,
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshEmpresa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (usuarioData) {
      setUsuario(usuarioData as Usuario);
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", (usuarioData as Usuario).empresa_id)
        .maybeSingle();
      setEmpresa(empresaData as Empresa);
    } else {
      setUsuario(null);
      setEmpresa(null);
    }
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await loadProfile(newSession.user.id);
      } else {
        setUsuario(null);
        setEmpresa(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(nome: string, empresaNome: string, email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, empresa_nome: empresaNome } },
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshEmpresa() {
    if (session?.user) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{ session, usuario, empresa, loading, signIn, signUp, signOut, refreshEmpresa }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
