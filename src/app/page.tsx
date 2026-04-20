import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.is_super_admin && !session.impersonating_client_id) {
    redirect("/admin");
  }
  redirect("/dashboard");
}
