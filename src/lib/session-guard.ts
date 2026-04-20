import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { prisma } from "./prisma";

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.is_super_admin) redirect("/dashboard");
  return session;
}

/**
 * Returns the active client_id for the current request:
 *  - If super_admin is impersonating, return that client_id
 *  - Otherwise: first client_users row matching the session email
 *  - null if the user has no client memberships
 */
export async function resolveActiveClient(session: Awaited<ReturnType<typeof requireSession>>) {
  if (session.is_super_admin && session.impersonating_client_id) {
    const c = await prisma.clients.findUnique({
      where: { id: session.impersonating_client_id }
    });
    return c;
  }

  const membership = await prisma.client_users.findFirst({
    where: { email: session.email.toLowerCase() },
    include: { clients: true },
    orderBy: { created_at: "asc" }
  });
  return membership?.clients ?? null;
}

export async function requireActiveClient(session: Awaited<ReturnType<typeof requireSession>>) {
  const client = await resolveActiveClient(session);
  if (!client) {
    // Super admin with no impersonation selected -> admin picker
    if (session.is_super_admin) redirect("/admin");
    redirect("/no-access");
  }
  return client;
}
