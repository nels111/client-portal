import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!);
const COOKIE_NAME = "sc_portal_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export type SessionUser = {
  user_id: string;
  email: string;
  name: string | null;
  is_super_admin: boolean;
  impersonating_client_id?: string | null;
};

export async function signSession(payload: SessionUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySession(raw);
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function createMagicLinkToken(email: string): Promise<string> {
  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.verification_tokens.deleteMany({ where: { identifier: email.toLowerCase() } });
  await prisma.verification_tokens.create({
    data: { identifier: email.toLowerCase(), token, expires }
  });
  return token;
}

export async function consumeMagicLinkToken(
  email: string,
  token: string
): Promise<boolean> {
  const row = await prisma.verification_tokens.findUnique({
    where: { identifier_token: { identifier: email.toLowerCase(), token } }
  });
  if (!row) return false;
  if (row.expires < new Date()) {
    await prisma.verification_tokens.deleteMany({
      where: { identifier: email.toLowerCase(), token }
    });
    return false;
  }
  await prisma.verification_tokens.deleteMany({
    where: { identifier: email.toLowerCase() }
  });
  return true;
}

export async function resolveUserForEmail(email: string) {
  const lower = email.toLowerCase();

  const admin = await prisma.super_admins.findUnique({ where: { email: lower } });
  const clientUsers = await prisma.client_users.findMany({
    where: { email: lower },
    include: { clients: true }
  });

  if (!admin && clientUsers.length === 0) return null;

  let user = await prisma.users.findUnique({ where: { email: lower } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: lower,
        name: admin?.name ?? clientUsers[0]?.name ?? null,
        email_verified: new Date()
      }
    });
  } else if (!user.email_verified) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: { email_verified: new Date() }
    });
  }

  if (admin && !admin.auth_id) {
    await prisma.super_admins.update({ where: { id: admin.id }, data: { auth_id: user.id } });
  }
  for (const cu of clientUsers) {
    if (!cu.auth_id) {
      await prisma.client_users.update({ where: { id: cu.id }, data: { auth_id: user.id } });
    }
  }

  return {
    user,
    is_super_admin: !!admin,
    client_memberships: clientUsers
  };
}
