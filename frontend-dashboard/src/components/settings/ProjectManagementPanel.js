"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderKanban, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  createMonitoringProject,
  deleteMonitoringProject,
  getMonitoringProjects,
  updateMonitoringProject,
} from "@/services/api";

const EMPTY_FORM = {
  name: "",
  description: "",
  active: true,
  match_mode: "broad",
  sources: "",
  keywords: "",
  topics: "",
  territories: "",
};

function splitCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function joinCsv(values) {
  return (values || []).join(", ");
}

function notifyProjectChange() {
  window.dispatchEvent(new CustomEvent("projects-updated"));
}

export default function ProjectManagementPanel() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

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
    const timer = window.setTimeout(() => void loadProjects(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProjects]);

  function startEdit(project) {
    setEditingId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
      active: project.active !== false,
      match_mode: project.match_mode || "broad",
      sources: joinCsv(project.sources),
      keywords: joinCsv(project.keywords),
      topics: joinCsv(project.topics),
      territories: joinCsv(project.territories),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
      match_mode: form.match_mode,
      sources: splitCsv(form.sources),
      keywords: splitCsv(form.keywords),
      topics: splitCsv(form.topics),
      territories: splitCsv(form.territories),
    };

    setSaving(true);
    setError("");
    try {
      if (editingId) await updateMonitoringProject(editingId, payload);
      else await createMonitoringProject(payload);
      resetForm();
      await loadProjects();
      notifyProjectChange();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError?.response?.data?.detail || "No fue posible guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(project) {
    try {
      await updateMonitoringProject(project.id, {
        name: project.name,
        description: project.description,
        active: !project.active,
        match_mode: project.match_mode || "broad",
        sources: project.sources || [],
        keywords: project.keywords || [],
        topics: project.topics || [],
        territories: project.territories || [],
      });
      await loadProjects();
      notifyProjectChange();
    } catch (requestError) {
      console.error(requestError);
      setError("No fue posible cambiar el estado del proyecto.");
    }
  }

  async function handleDelete(projectId) {
    try {
      await deleteMonitoringProject(projectId);
      if (editingId === projectId) resetForm();
      await loadProjects();
      notifyProjectChange();
    } catch (requestError) {
      console.error(requestError);
      setError("No fue posible eliminar el proyecto.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-300"><FolderKanban size={20} /></div>
        <div>
          <h2 className="text-lg font-semibold text-white">Monitoring Projects</h2>
          <p className="text-sm text-slate-400">Configura el alcance por cliente, territorio o asunto y elige qué tan estricta debe ser la coincidencia.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3 lg:grid-cols-2">
        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nombre del proyecto" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
        <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descripción" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
        <input value={form.sources} onChange={(event) => setForm({ ...form, sources: event.target.value })} placeholder="Fuentes opcionales: BBC Mundo, Google News" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
        <input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="Keywords: agua, seguridad, candidato" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
        <input value={form.topics} onChange={(event) => setForm({ ...form, topics: event.target.value })} placeholder="Topics: agua, elecciones, transporte" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />
        <input value={form.territories} onChange={(event) => setForm({ ...form, territories: event.target.value })} placeholder="Territorios: Chimalhuacán, Nezahualcóyotl" className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50" />

        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matching mode</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ value: "broad", label: "Amplio", help: "Keyword OR topic OR territorio" }, { value: "strict", label: "Estricto", help: "Keyword AND topic AND territorio" }].map((option) => (
              <button key={option.value} type="button" onClick={() => setForm({ ...form, match_mode: option.value })} className={`rounded-lg border p-3 text-left ${form.match_mode === option.value ? "border-cyan-500/40 bg-cyan-500/10" : "border-slate-800 bg-slate-950/40"}`}>
                <p className="text-sm font-medium text-white">{option.label}</p>
                <p className="mt-1 text-xs text-slate-500">{option.help}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
          <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-4 w-4" />
          Proyecto activo y disponible en el selector global
        </label>

        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <button type="submit" disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
            {editingId ? <Save size={16} /> : <Plus size={16} />} {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear proyecto"}
          </button>
          {editingId && <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300"><X size={16} /> Cancelar</button>}
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-slate-500">Cargando proyectos...</p>}
        {!loading && projects.length === 0 && <p className="text-sm text-slate-500">Todavía no hay proyectos configurados.</p>}
        {projects.map((project) => (
          <article key={project.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-white">{project.name}</h3>
                  <button type="button" onClick={() => toggleActive(project)} className={`rounded-full border px-2 py-0.5 text-xs ${project.active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-400"}`}>{project.active ? "Activo" : "Inactivo"}</button>
                  <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-xs text-cyan-300">{project.match_mode === "strict" ? "Estricto" : "Amplio"}</span>
                </div>
                {project.description && <p className="mt-1 text-sm text-slate-400">{project.description}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  {(project.sources || []).map((value) => <span key={`s-${value}`} className="rounded-full bg-violet-500/10 px-2 py-1 text-violet-300">{value}</span>)}
                  {(project.keywords || []).map((value) => <span key={`k-${value}`} className="rounded-full bg-slate-800 px-2 py-1">#{value}</span>)}
                  {(project.topics || []).map((value) => <span key={`p-${value}`} className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">{value}</span>)}
                  {(project.territories || []).map((value) => <span key={`t-${value}`} className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">{value}</span>)}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(project)} className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-cyan-300" aria-label={`Editar ${project.name}`}><Pencil size={16} /></button>
                <button type="button" onClick={() => handleDelete(project.id)} className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-300" aria-label={`Eliminar ${project.name}`}><Trash2 size={16} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
