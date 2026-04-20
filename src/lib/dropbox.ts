// Dropbox helper: refresh token -> short-lived access token -> temporary file link.
// Uses Dropbox API v2 (/oauth2/token, /files/get_temporary_link, /files/list_folder).

const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const API_BASE = "https://api.dropboxapi.com/2";

type CachedToken = { token: string; expires_at: number };
let cached: CachedToken | null = null;

export async function getDropboxAccessToken(): Promise<string> {
  const key = process.env.DROPBOX_APP_KEY;
  const secret = process.env.DROPBOX_APP_SECRET;
  const refresh = process.env.DROPBOX_REFRESH_TOKEN;

  if (!key || !secret || !refresh) {
    throw new Error("Dropbox credentials missing. Check DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN.");
  }

  const now = Date.now();
  if (cached && cached.expires_at > now + 60_000) {
    return cached.token;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh
  });
  const basic = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox token refresh failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: json.access_token,
    expires_at: now + json.expires_in * 1000
  };
  return cached.token;
}

export async function getTemporaryLink(path: string): Promise<string> {
  const token = await getDropboxAccessToken();
  const res = await fetch(`${API_BASE}/files/get_temporary_link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path }),
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox get_temporary_link failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { link: string };
  return json.link;
}

export type DropboxFile = {
  id: string;
  name: string;
  path_lower: string;
  path_display: string;
  size: number;
  client_modified: string;
  server_modified: string;
};

export async function listFolderRecursive(path: string): Promise<DropboxFile[]> {
  const token = await getDropboxAccessToken();
  const out: DropboxFile[] = [];

  let res = await fetch(`${API_BASE}/files/list_folder`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ path, recursive: true, limit: 2000 }),
    cache: "no-store"
  });

  while (true) {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Dropbox list_folder failed (${res.status}): ${text}`);
    }
    const json = (await res.json()) as {
      entries: Array<{ ".tag": string } & Partial<DropboxFile>>;
      cursor: string;
      has_more: boolean;
    };
    for (const e of json.entries) {
      if (e[".tag"] === "file" && e.id && e.name && e.path_lower && e.path_display) {
        out.push({
          id: e.id,
          name: e.name,
          path_lower: e.path_lower,
          path_display: e.path_display,
          size: e.size ?? 0,
          client_modified: e.client_modified ?? "",
          server_modified: e.server_modified ?? ""
        });
      }
    }
    if (!json.has_more) break;
    res = await fetch(`${API_BASE}/files/list_folder/continue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cursor: json.cursor }),
      cache: "no-store"
    });
  }
  return out;
}
