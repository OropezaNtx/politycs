"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getMonitoringProjects } from "@/services/api";

const ProjectContext = createContext(null);
const STORAGE_KEY = "politycs.activeProjectId";

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectIdState] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const refreshProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await getMonitoringProjects();
      const nextProjects = (data.projects || []).filter((project) => project.active !== false);
      setProjects(nextProjects);

      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const storedId = stored ? Number(stored) : null;
      if (storedId && nextProjects.some((project) => project.id === storedId)) {
        setProjectIdState(storedId);
      } else if (projectId && !nextProjects.some((project) => project.id === projectId)) {
        setProjectIdState(null);
        if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error loading monitoring projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, [projectId]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refreshProjects();
    }, 0);
    const handleProjectsUpdated = () => {
      void refreshProjects();
    };
    window.addEventListener("projects-updated", handleProjectsUpdated);
    return () => {
      window.clearTimeout(initialTimer);
      window.removeEventListener("projects-updated", handleProjectsUpdated);
    };
  }, [refreshProjects]);

  const setProjectId = useCallback((value) => {
    const next = value ? Number(value) : null;
    setProjectIdState(next);
    if (typeof window !== "undefined") {
      if (next) window.localStorage.setItem(STORAGE_KEY, String(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === projectId) || null,
    [projects, projectId]
  );

  return (
    <ProjectContext.Provider
      value={{ projects, projectId, activeProject, loadingProjects, setProjectId, refreshProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used inside ProjectProvider");
  return context;
}
