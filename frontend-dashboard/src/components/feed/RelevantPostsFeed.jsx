const posts = [
  {
    title: "Vecinos reportan falta de seguridad en la zona centro",
    source: "news_site",
    sentiment: "Negativo",
    score: 91,
  },
  {
    title: "Aumentan comentarios sobre transporte público y tiempos de espera",
    source: "hacker_news",
    sentiment: "Neutral",
    score: 78,
  },
  {
    title: "Ciudadanos destacan mejora en servicios de recolección",
    source: "news_site",
    sentiment: "Positivo",
    score: 74,
  },
  {
    title: "Discusión pública sobre agua gana relevancia esta semana",
    source: "social",
    sentiment: "Negativo",
    score: 69,
  },
];

export default function RelevantPostsFeed() {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-black/20">
      <h2 className="text-lg font-semibold text-white">Posts relevantes</h2>
      <p className="mb-6 text-sm text-slate-400">
        Contenido priorizado por score político.
      </p>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.title}
            className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                {post.source}
              </span>

              <span className="text-xs text-cyan-300">
                Score {post.score}
              </span>
            </div>

            <h3 className="text-sm font-medium text-white leading-relaxed">
              {post.title}
            </h3>

            <p className="mt-3 text-xs text-slate-500">
              Sentimiento:{" "}
              <span className="text-slate-300">{post.sentiment}</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
