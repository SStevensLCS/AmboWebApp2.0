import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ambassador Portal",
  description: "Student Ambassador service hours and tour credits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-navy">
        {children}
      </body>
    </html>
  );
}
