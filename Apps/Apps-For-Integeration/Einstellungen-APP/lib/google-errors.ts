const DRIVE_API_CONSOLE_URL =
  "https://console.cloud.google.com/apis/api/drive.googleapis.com/overview";

export function googleDriveApiConsoleUrl(clientId = "") {
  const projectNumber = clientId.trim().match(/^(\d{6,})-/)?.[1];
  return projectNumber
    ? `${DRIVE_API_CONSOLE_URL}?project=${encodeURIComponent(projectNumber)}`
    : DRIVE_API_CONSOLE_URL;
}

export function friendlyGoogleDriveError(message: string | null | undefined) {
  const raw = String(message || "").trim();
  const normalized = raw.toLowerCase();
  const apiDisabled =
    normalized.includes("google drive api has not been used") ||
    (normalized.includes("drive.googleapis.com") && normalized.includes("disabled")) ||
    normalized.includes("accessnotconfigured") ||
    normalized.includes("service_disabled");

  if (apiDisabled) {
    return "Die Google Drive API ist in deinem Google-Cloud-Projekt noch nicht aktiviert. Aktiviere sie einmal und versuche es nach einigen Minuten erneut.";
  }
  if (normalized.includes("insufficient authentication scopes")) {
    return "Google Drive wurde ohne die erforderliche Leseberechtigung verbunden. Bitte die Google-Freigabe erneut starten und Drive-Lesezugriff erlauben.";
  }
  if (normalized.includes("daily limit") || normalized.includes("quota")) {
    return "Das Google-Drive-Kontingent ist derzeit ausgeschöpft. Bitte die API-Nutzung in Google Cloud prüfen und später erneut versuchen.";
  }
  return raw || "Google Drive konnte nicht gelesen werden.";
}

export function isGoogleDriveApiDisabled(message: string | null | undefined) {
  return friendlyGoogleDriveError(message).startsWith("Die Google Drive API ist");
}

