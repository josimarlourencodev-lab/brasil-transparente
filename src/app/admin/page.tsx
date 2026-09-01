import type { Metadata } from "next";
import { cookies } from "next/headers";
import { isAdminCookie } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin-login";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const store = await cookies();
  const autenticado = isAdminCookie(store.get("bt_admin")?.value);

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-neutral-dark text-white">
        <AdminLogin />
      </div>
    );
  }

  return <AdminPanel />;
}