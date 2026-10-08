const fs = require("node:fs");
const path = require("node:path");
const { app, ipcMain } = require("electron");

const CHANNELS = [
  "desktop:learner-profile:read",
  "desktop:learner-profile:merge",
  "desktop:learner-profile:replace",
  "desktop:learner-profile:export",
];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function profilePath() {
  return path.join(
    app.getPath("appData"),
    "StudySuite",
    "learner-profile.v1.json",
  );
}

function readProfile() {
  const filePath = profilePath();
  if (!fs.existsSync(filePath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfile(profile) {
  const filePath = profilePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(profile, null, 2)}\n`,
    "utf8",
  );
  if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
  fs.renameSync(temporaryPath, filePath);
  return jsonClone(profile);
}

function mergeProfile(current, update, productId) {
  const now = new Date().toISOString();
  const source = isRecord(current) ? current : {};
  const patch = isRecord(update) ? update : {};
  const currentPrivacy = isRecord(source.privacy) ? source.privacy : {};
  const currentLanguages = isRecord(source.languages) ? source.languages : {};
  const next = {
    ...source,
    schemaVersion: 1,
    profileId:
      typeof source.profileId === "string" && source.profileId
        ? source.profileId
        : crypto.randomUUID(),
    createdAt: typeof source.createdAt === "string" ? source.createdAt : now,
    updatedAt: now,
    ...(typeof patch.displayName === "string"
      ? { displayName: patch.displayName.slice(0, 120) }
      : {}),
    ...(typeof patch.avatarDataUrl === "string"
      ? { avatarDataUrl: patch.avatarDataUrl.slice(0, 2_000_000) }
      : {}),
    privacy: isRecord(patch.privacy)
      ? { ...currentPrivacy, ...patch.privacy }
      : currentPrivacy,
    languages: { ...currentLanguages },
  };

  if (
    (patch.language === "english" || patch.language === "german") &&
    isRecord(patch.track)
  ) {
    const previousTrack = isRecord(currentLanguages[patch.language])
      ? currentLanguages[patch.language]
      : {};
    next.languages[patch.language] = {
      ...previousTrack,
      ...patch.track,
      language: patch.language,
      updatedAt: now,
      updatedBy: productId,
    };
  }

  return next;
}

function registerLearnerProfileBridge(options = {}) {
  const productId = String(options.productId || "study-suite");
  const isTrustedUrl =
    typeof options.isTrustedUrl === "function"
      ? options.isTrustedUrl
      : () => false;

  function assertTrusted(event) {
    const url = event.senderFrame?.url || event.sender.getURL();
    if (!isTrustedUrl(url))
      throw new Error("Untrusted learner profile request.");
  }

  for (const channel of CHANNELS) ipcMain.removeHandler(channel);

  ipcMain.handle(CHANNELS[0], (event) => {
    assertTrusted(event);
    return jsonClone(readProfile());
  });
  ipcMain.handle(CHANNELS[1], (event, update) => {
    assertTrusted(event);
    return writeProfile(mergeProfile(readProfile(), update, productId));
  });
  ipcMain.handle(CHANNELS[2], (event, profile) => {
    assertTrusted(event);
    if (!isRecord(profile)) throw new Error("The learner profile is invalid.");
    return writeProfile({
      ...jsonClone(profile),
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    });
  });
  ipcMain.handle(CHANNELS[3], (event) => {
    assertTrusted(event);
    return jsonClone(readProfile());
  });

  return () => {
    for (const channel of CHANNELS) ipcMain.removeHandler(channel);
  };
}

module.exports = { registerLearnerProfileBridge };
