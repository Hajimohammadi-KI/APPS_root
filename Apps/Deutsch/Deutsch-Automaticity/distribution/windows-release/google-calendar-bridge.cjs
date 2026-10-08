const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { app, ipcMain, safeStorage, shell } = require("electron");

const CHANNELS = [
  "desktop:calendar:status",
  "desktop:calendar:connect",
  "desktop:calendar:sync",
  "desktop:calendar:disconnect",
];
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

function tokenPath() {
  return path.join(app.getPath("appData"), "StudySuite", "google-calendar.enc");
}

function readOAuth(resourcesPath) {
  try {
    const value = JSON.parse(
      fs.readFileSync(path.join(resourcesPath, "google-oauth.json"), "utf8"),
    );
    const installed = value?.installed;
    if (!installed?.client_id || !installed?.client_secret) return null;
    return {
      clientId: String(installed.client_id),
      clientSecret: String(installed.client_secret),
      authUri: String(
        installed.auth_uri || "https://accounts.google.com/o/oauth2/auth",
      ),
      tokenUri: String(
        installed.token_uri || "https://oauth2.googleapis.com/token",
      ),
    };
  } catch {
    return null;
  }
}

function readToken() {
  if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(tokenPath()))
    return null;
  try {
    const encrypted = Buffer.from(
      fs.readFileSync(tokenPath(), "utf8"),
      "base64",
    );
    return JSON.parse(safeStorage.decryptString(encrypted));
  } catch {
    return null;
  }
}

function writeToken(token) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Windows encrypted credential storage is unavailable.");
  }
  const filePath = tokenPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    safeStorage.encryptString(JSON.stringify(token)).toString("base64"),
    "utf8",
  );
}

function calendarStatus(resourcesPath) {
  const oauth = readOAuth(resourcesPath);
  const token = readToken();
  return {
    available: true,
    configured: Boolean(oauth),
    connected: Boolean(token?.refresh_token || token?.access_token),
    email: typeof token?.email === "string" ? token.email : null,
    lastSyncAt: typeof token?.lastSyncAt === "string" ? token.lastSyncAt : null,
  };
}

async function postForm(url, values) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(values),
    signal: AbortSignal.timeout(60_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      String(
        data?.error_description ||
          data?.error ||
          `Google request failed (${response.status}).`,
      ).slice(0, 600),
    );
  }
  return data;
}

async function connect(resourcesPath) {
  const oauth = readOAuth(resourcesPath);
  if (!oauth)
    throw new Error(
      "Google Calendar OAuth is not configured in this installer.",
    );
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Windows encrypted credential storage is unavailable.");
  }

  const state = randomBytes(24).toString("base64url");
  const authorization = await new Promise((resolve, reject) => {
    let settled = false;
    let timeout;
    const server = http.createServer();
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      server.close();
      if (error) reject(error);
      else resolve(value);
    };
    server.on("request", (request, response) => {
      const callbackUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (callbackUrl.pathname !== "/oauth/callback") {
        response.writeHead(404).end();
        return;
      }
      const error = callbackUrl.searchParams.get("error");
      const code = callbackUrl.searchParams.get("code");
      const returnedState = callbackUrl.searchParams.get("state");
      const ok = !error && Boolean(code) && returnedState === state;
      response.writeHead(ok ? 200 : 400, {
        "content-type": "text/html; charset=utf-8",
      });
      response.end(
        ok
          ? "<!doctype html><meta charset=utf-8><title>Connected</title><h1>Google Calendar connected.</h1><p>You can close this window.</p>"
          : "<!doctype html><meta charset=utf-8><title>Not connected</title><h1>Connection failed.</h1><p>Return to the app and try again.</p>",
      );
      if (error) finish(new Error(`Google authorization failed: ${error}`));
      else if (!code || returnedState !== state)
        finish(new Error("Google returned an invalid authorization response."));
      else finish(null, { code, redirectUri: server.redirectUri });
    });
    server.on("error", (error) => finish(error));
    server.listen(0, "127.0.0.1", async () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        finish(new Error("The local Google callback could not start."));
        return;
      }
      const redirectUri = `http://127.0.0.1:${address.port}/oauth/callback`;
      server.redirectUri = redirectUri;
      const authUrl = new URL(oauth.authUri);
      authUrl.search = new URLSearchParams({
        client_id: oauth.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
      }).toString();
      try {
        await shell.openExternal(authUrl.toString());
      } catch (error) {
        finish(error);
      }
    });
    timeout = setTimeout(
      () => finish(new Error("Google authorization timed out.")),
      180_000,
    );
  });

  const token = await postForm(oauth.tokenUri, {
    code: authorization.code,
    client_id: oauth.clientId,
    client_secret: oauth.clientSecret,
    redirect_uri: authorization.redirectUri,
    grant_type: "authorization_code",
  });
  const accessToken = token.access_token;
  const profileResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(30_000),
    },
  );
  const profile = await profileResponse.json().catch(() => ({}));
  writeToken({
    access_token: accessToken,
    refresh_token: token.refresh_token,
    expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000,
    email: typeof profile.email === "string" ? profile.email : null,
    lastSyncAt: null,
  });
  return calendarStatus(resourcesPath);
}

async function accessToken(resourcesPath) {
  const oauth = readOAuth(resourcesPath);
  const token = readToken();
  if (!oauth || !token)
    throw new Error("Connect Google Calendar in Settings first.");
  if (
    token.access_token &&
    Number(token.expiry_date || 0) > Date.now() + 60_000
  )
    return { oauth, token };
  if (!token.refresh_token)
    throw new Error("Google access expired. Connect the account again.");
  const refreshed = await postForm(oauth.tokenUri, {
    client_id: oauth.clientId,
    client_secret: oauth.clientSecret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });
  const next = {
    ...token,
    access_token: refreshed.access_token,
    expiry_date: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
  };
  writeToken(next);
  return { oauth, token: next };
}

function nextDate(date) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function normalizeEvents(events) {
  if (!Array.isArray(events))
    throw new Error("Calendar events must be an array.");
  return events.slice(0, 500).map((event) => {
    const id = String(event?.id || "").slice(0, 300);
    const date = String(event?.date || "");
    if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error("A calendar event is invalid.");
    return {
      id,
      date,
      title: String(event?.title || "Study practice").slice(0, 240),
      description: String(event?.description || "").slice(0, 4_000),
    };
  });
}

async function googleJson(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(60_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      String(
        data?.error?.message ||
          `Google Calendar request failed (${response.status}).`,
      ).slice(0, 600),
    );
  return data;
}

async function syncCalendar(events, resourcesPath, productId) {
  const rows = normalizeEvents(events);
  const { token } = await accessToken(resourcesPath);
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const row of rows) {
    const lookup = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    );
    lookup.searchParams.set(
      "privateExtendedProperty",
      `studySuiteId=${row.id}`,
    );
    lookup.searchParams.set("maxResults", "2");
    lookup.searchParams.set("singleEvents", "true");
    const existing = (await googleJson(lookup.toString(), token.access_token))
      .items?.[0];
    const body = {
      summary: row.title,
      description: row.description,
      start: { date: row.date },
      end: { date: nextDate(row.date) },
      extendedProperties: {
        private: { studySuiteId: row.id, studyProductId: productId },
      },
    };
    if (!existing) {
      await googleJson(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        token.access_token,
        { method: "POST", body: JSON.stringify(body) },
      );
      created += 1;
    } else if (
      existing.summary !== body.summary ||
      existing.description !== body.description ||
      existing.start?.date !== body.start.date
    ) {
      await googleJson(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(existing.id)}`,
        token.access_token,
        { method: "PATCH", body: JSON.stringify(body) },
      );
      updated += 1;
    } else {
      unchanged += 1;
    }
  }

  const syncedAt = new Date().toISOString();
  writeToken({ ...token, lastSyncAt: syncedAt });
  return {
    created,
    updated,
    unchanged,
    deleted: 0,
    total: rows.length,
    syncedAt,
  };
}

function registerGoogleCalendarBridge(options = {}) {
  const productId = String(options.productId || "study-suite");
  const resourcesPath = String(options.resourcesPath || process.resourcesPath);
  const isTrustedUrl =
    typeof options.isTrustedUrl === "function"
      ? options.isTrustedUrl
      : () => false;
  function assertTrusted(event) {
    const url = event.senderFrame?.url || event.sender.getURL();
    if (!isTrustedUrl(url)) throw new Error("Untrusted calendar request.");
  }
  for (const channel of CHANNELS) ipcMain.removeHandler(channel);
  ipcMain.handle(CHANNELS[0], (event) => {
    assertTrusted(event);
    return calendarStatus(resourcesPath);
  });
  ipcMain.handle(CHANNELS[1], async (event) => {
    assertTrusted(event);
    return connect(resourcesPath);
  });
  ipcMain.handle(CHANNELS[2], async (event, events) => {
    assertTrusted(event);
    return syncCalendar(events, resourcesPath, productId);
  });
  ipcMain.handle(CHANNELS[3], (event) => {
    assertTrusted(event);
    fs.rmSync(tokenPath(), { force: true });
    return calendarStatus(resourcesPath);
  });
  return () => {
    for (const channel of CHANNELS) ipcMain.removeHandler(channel);
  };
}

module.exports = { registerGoogleCalendarBridge };
