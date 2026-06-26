import type { Metadata } from "next";
import RegisterPage from "@/components/ui/RegisterPage";

export const metadata: Metadata = {
  title: "Register Studio — JH Studio Management",
  description:
    "Register your photography studio on JH Studio. Create your studio profile and admin account in minutes.",
};

export default function Page() {
  return <RegisterPage />;
}
