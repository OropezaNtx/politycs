"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Plus, Trash2 } from "lucide-react";

import {
  createMonitoringProject,
  deleteMonitoringProject,
  getMonitoringProjects,
} from "@/services/api";

function splitCsv(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ProjectManagementPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    sources: "",
    keywords: "",
    topics: "",
    territories: "",
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMonitoringProjects();
      setProjects(data.projects || []);
    } catch (requestError) {
      console.error(requestError);
      setError("No fue posible cargar los proyectos de monitoreo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setError("");
    try {
      await createMonitoringProject({
        name: form.name.trim(),
        description: form.description.trim() || null,
        active: true,
        sources: splitCsv(form.sources),
        keywords: splitCsv(form.keywords),
        topics: splitCsv(form.topics),
        territories: splitCsv(form.territories),
      });
      setForm({ name: "", description: "", sources: "", keywords: "", topics: "", territories: "" });
      await loadProjects();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.response?.data?.detail || "No fue posible crear el proyecto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId) {
    try {
      await deleteMonitoringProject(projectId);
      await loadProjects();
    } catch (requestError) {
      console.error(requestError);
      setError("No fue posible eliminar el proyecto.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300">
          <FolderKanban size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Monitoring Projects</h2>
          <p className="text-sm text-slate-400">Define el alcance de monitoreo para un cliente, territorio o asunto específico.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 lg:grid-cols-2">
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nombre del proyecto"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <input
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Descripción"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <input
          value={form.sources}
          onChange={(event) => setForm({ ...form, sources: event.target.value })}
          placeholder="Fuentes: BBC Mundo, Google News"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <input
          value={form.keywords}
          onChange={(event) => setForm({ ...form, keywords: event.target.value })}
          placeholder="Keywords: agua, seguridad, candidato"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <input
          value={form.topics}
          onChange={(event) => setForm({ ...form, topics: event.target.value })}
          placeholder="Topics: agua, elecciones, transporte"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <input
          value={form.territories}
          onChange={(event) => setForm({ ...form, territories: event.target.value })}
          placeholder="Territorios: Chimalhuacán, Nezahualcóyotl"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={16} /> {saving ? "Creando..." : "Crear proyecto"}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-500">Cargando proyectos...</p>}
        {!loading && projects.length === 0 && (
          <p className="text-sm text-slate-500">Todavía no hay proyectos configurados.</p>
        )}
        {projects.map((project) => (
          <article key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{project.name}</h3>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                    {project.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                {project.description && <p className="mt-1 text-sm text-slate-400">{project.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {(project.keywords || []).map((value) => <span key={`k-${value}`} className="rounded-full bg-slate-800 px-2 py-1">#{value}</span>)}
                  {(project.territories || []).map((value) => <span key={`t-${value}`} className="rounded-full bg-slate-800 px-2 py-1">{value}</span>)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-300 transition hover:bg-red-500/10"
                aria-label={`Eliminar ${project.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
