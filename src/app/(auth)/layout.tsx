import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) {
    if (session.is_super_admin && !session.impersonating_client_id) redirect("/admin");
    redirect("/dashboard");
  }
  return <>{children}</>;
}
