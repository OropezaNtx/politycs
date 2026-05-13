import "./globals.css";

import { SourceProvider } from "@/context/SourceContext";

export const metadata = {
  title: "Politycs Dashboard",
  description: "Political Intelligence Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <SourceProvider>
          {children}
        </SourceProvider>
      </body>
    </html>
  );
}