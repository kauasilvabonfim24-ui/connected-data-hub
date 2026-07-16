import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/cadastro")({
  ssr: false,
  component: SignupPage,
});

function SignupPage() {
  const { signUp } = useAuth();
  const [nome, setNome] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp(nome, empresaNome, email, password);
    setLoading(false);
    if (error) setError(error);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand px-4">
        <div className="card w-full max-w-sm p-6 text-center">
          <h2 className="font-display text-lg font-semibold text-ink">Quase lá!</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Enviamos um e-mail de confirmação para <strong>{email}</strong>. Confirme para ativar
            sua conta e começar a usar o Servix IA.
          </p>
          <Link to="/login" className="btn-primary mt-5 inline-flex">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber font-display text-xl font-bold text-brand">
            S
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Criar sua conta</h1>
          <p className="mt-1 text-sm text-brand-100">
            Comece a automatizar seu atendimento hoje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="label" htmlFor="nome">
            Seu nome
          </label>
          <input
            id="nome"
            required
            className="input mb-4"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label className="label" htmlFor="empresa">
            Nome da empresa
          </label>
          <input
            id="empresa"
            required
            className="input mb-4"
            placeholder="Ex: Elétrica do Kauã"
            value={empresaNome}
            onChange={(e) => setEmpresaNome(e.target.value)}
          />

          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            className="input mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <p className="mt-4 text-center text-sm text-ink-muted">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
