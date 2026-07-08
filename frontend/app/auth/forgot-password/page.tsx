import type { Metadata } from "next";
import ForgotPasswordPage from "@/components/ui/ForgotPasswordPage";

export const metadata: Metadata = {
  title: "Forgot Password — JH Studio Management",
  description: "Reset your JH Studio Management account password.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
