import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailPage from "@/components/ui/VerifyEmailPage";

export const metadata: Metadata = {
  title: "Verify Email — JH Studio Management",
  description: "Verify your email address to activate your JH Studio Management account.",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailPage />
    </Suspense>
  );
}
