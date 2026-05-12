import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <section className="max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400 mb-4">
          Politycs Intelligence Platform
        </p>

        <h1 className="text-5xl font-bold mb-6">
          Inteligencia política basada en datos públicos
        </h1>

        <p className="text-slate-300 text-lg mb-8">
          Monitorea conversación pública, tendencias, sentimiento y relevancia
          política desde una plataforma visual.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 transition"
        >
          Entrar al dashboard
        </Link>
      </section>
    </main>
  );
}
