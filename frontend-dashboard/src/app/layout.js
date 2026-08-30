import "./globals.css";
import "leaflet/dist/leaflet.css";

import { SourceProvider } from "@/context/SourceContext";
import { ProjectProvider } from "@/context/ProjectContext";

export const metadata = {
  title: "Politycs Intelligence Platform",
  description: "Public intelligence, territorial monitoring and risk signals",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SourceProvider>
          <ProjectProvider>{children}</ProjectProvider>
        </SourceProvider>
      </body>
    </html>
  );
}
