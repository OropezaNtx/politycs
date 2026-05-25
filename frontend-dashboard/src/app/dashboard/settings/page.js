import DashboardLayout from "@/components/layout/DashboardLayout";
import SourceManagementPanel from "@/components/settings/SourceManagementPanel";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <section className="space-y-8">
        <div>
          <p className="text-sm text-cyan-400 font-medium">
            Settings
          </p>

          <h1 className="text-3xl font-bold text-white">
            Source Management
          </h1>

          <p className="mt-2 text-slate-400">
            Administra y visualiza las fuentes conectadas a Politycs.
          </p>
        </div>

        <SourceManagementPanel />
      </section>
    </DashboardLayout>
  );
}