import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JH Studio — Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      {children}
    </div>
  );
}
