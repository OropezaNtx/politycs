import DashboardLayout from "@/components/layout/DashboardLayout";
import SourceManagementPanel from "@/components/settings/SourceManagementPanel";
import ProjectManagementPanel from "@/components/settings/ProjectManagementPanel";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-cyan-400 font-medium">
            Settings
          </p>

          <h1 className="text-3xl font-bold text-white">
            Intelligence Configuration
          </h1>

          <p className="mt-2 text-slate-400">
            Administra fuentes y proyectos de monitoreo para adaptar Politycs a cada cliente o territorio.
          </p>
        </div>

        <ProjectManagementPanel />
        <SourceManagementPanel />
      </section>
    </DashboardLayout>
  );
}
