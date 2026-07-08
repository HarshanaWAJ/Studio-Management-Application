import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordPage from "@/components/ui/ResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset Password — JH Studio Management",
  description: "Choose a new password for your JH Studio Management account.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPage />
    </Suspense>
  );
}
