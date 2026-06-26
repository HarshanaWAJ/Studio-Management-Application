import type { Metadata } from "next";
import LoginPage from "@/components/ui/LoginPage";

export const metadata: Metadata = {
  title: "Sign In — JH Studio Management",
  description:
    "Sign in to your JH Studio photography management account to manage bookings, clients, equipment and more.",
};

export default function Page() {
  return <LoginPage />;
}
