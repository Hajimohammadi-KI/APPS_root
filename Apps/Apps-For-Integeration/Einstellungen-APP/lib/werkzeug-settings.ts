export const WERKZEUG_SETTINGS_VERSION = 1 as const;
export type SettingsGrant = "profile" | "planning" | "accessibility" | "permissions" | "ai" | "organization";
export type SettingsClient = { id: string; displayName: string; origin: string; enabled: boolean; grants: SettingsGrant[] };
export type ProjectSourceKind = "github" | "google_drive" | "local";
export type ProjectSource = { id: string; name: string; kind: ProjectSourceKind; location: string; enabled: boolean };

const CURRENT_SITE_ORIGIN = "https://werkzeug-study-tools.education-hajimohamm.chatgpt.site";
const LEGACY_CHATGPT_SITE_ORIGIN = /^https:\/\/[^/]+\.chatgpt\.site(?=\/|$)/i;

export type WerkzeugSettings = {
  version: typeof WERKZEUG_SETTINGS_VERSION;
  labels: {
    appName: string;
    appSubtitle: string;
    groups: {
      personal: string;
      work: string;
      services: string;
      organization: string;
      data: string;
    };
    sections: {
      profile: string;
      planning: string;
      accessibility: string;
      permissions: string;
      organization: string;
      sharing: string;
      backup: string;
    };
    services: {
      google: string;
      calendar: string;
      gmail: string;
      drive: string;
      openai: string;
      deepl: string;
    };
    folderLevels: {
      project: string;
      subproject: string;
      topic: string;
      material: string;
    };
    navigation: {
      workspace: string;
      calendar: string;
      calendarSubtitle: string;
      programEntries: string;
      mail: string;
      mailSubtitle: string;
      notes: string;
      notesSubtitle: string;
      connections: string;
      connectionsSubtitle: string;
      centralSettings: string;
      centralSettingsSubtitle: string;
      standaloneApp: string;
    };
    cards: {
      centralSettings: string;
      jsonImport: string;
      embed: string;
      integrationApi: string;
    };
  };
  profile: {
    displayName: string;
    language: "de" | "en" | "fa";
    timezone: string;
    humanAvatar: boolean;
  };
  planning: {
    projectName: string;
    planName: string;
    planStartDate: string;
    planEndDate: string;
    totalPlanWeeks: number;
    dailyCapacityMinutes: number;
    weeklyGoalMinutes: number;
    workdayStart: string;
    restDays: number[];
  };
  accessibility: {
    focusMode: boolean;
    largerText: boolean;
    generousLineHeight: boolean;
    readingRuler: boolean;
    reducedMotion: boolean;
  };
  permissions: {
    googleCalendarRead: boolean;
    gmailRead: boolean;
    googleDriveRead: boolean;
  };
  ai: {
    explanationProvider: "openai" | "none";
    translationProvider: "deepl" | "openai" | "none";
    targetLanguage: "fa" | "de" | "en";
  };
  organization: {
    nestedFolders: boolean;
    defaultProjectFolder: string;
    sources: ProjectSource[];
  };
  integration: {
    trustedOrigins: string[];
    clients: SettingsClient[];
    notifyOnChange: boolean;
    links: {
      homeUrl: string;
      settingsUrl: string;
      embedUrl: string;
      sdkUrl: string;
      apiBaseUrl: string;
      helpUrl: string;
      googleCallbackUrl: string;
      googleJavaScriptOrigin: string;
      googleProjectNumber: string;
      googleTestUserEmail: string;
      googleAudienceUrl: string;
      googleCredentialsUrl: string;
      googleDriveApiUrl: string;
      googleCalendarApiUrl: string;
      googleGmailApiUrl: string;
    };
  };
  updatedAt: string;
};

export const DEFAULT_WERKZEUG_SETTINGS: WerkzeugSettings = {
  version: WERKZEUG_SETTINGS_VERSION,
  labels: {
    appName: "Einstellungen",
    appSubtitle: "Zentrale Einstellungen für alle Apps",
    groups: {
      personal: "Profil & Darstellung",
      work: "Arbeit, Planung & Fokus",
      services: "Dienste & Berechtigungen",
      organization: "Projekte, Ordner & Apps",
      data: "Daten & Sicherung",
    },
    sections: {
      profile: "Profilbild und menschlicher Avatar",
      planning: "Persönliche Planparameter",
      accessibility: "ADHS- und Dyslexie-Einstellungen",
      permissions: "Berechtigungen und verbundene Dienste",
      organization: "Projekte und verschachtelte Ordner",
      sharing: "Von anderen Programmen aufrufen",
      backup: "Datensicherung",
    },
    services: {
      google: "Google Workspace",
      calendar: "Google Calendar",
      gmail: "Gmail",
      drive: "Google Drive",
      openai: "OpenAI",
      deepl: "DeepL",
    },
    folderLevels: {
      project: "Projekt",
      subproject: "Teilprojekt",
      topic: "Thema",
      material: "Material",
    },
    navigation: {
      workspace: "Arbeitsbereich",
      calendar: "Kalender & Kapazität",
      calendarSubtitle: "Programm und Termine",
      programEntries: "Programmeinträge",
      mail: "E-Mails & Dokumente",
      mailSubtitle: "Selektiver Import",
      notes: "Notizen",
      notesSubtitle: "Automatisch gespeichert",
      connections: "Verbindungen",
      connectionsSubtitle: "Google & Einbettung",
      centralSettings: "Zentrale Einstellungen",
      centralSettingsSubtitle: "Für alle verbundenen Apps",
      standaloneApp: "Eigenständige App",
    },
    cards: {
      centralSettings: "Zentrale Einstellungen",
      jsonImport: "JSON-Plan importieren",
      embed: "In andere Apps einbetten",
      integrationApi: "Sichere Integrations-API",
    },
  },
  profile: {
    displayName: "Benutzerin",
    language: "de",
    timezone: "Europe/Berlin",
    humanAvatar: true,
  },
  planning: {
    projectName: "Mein Lernprojekt",
    planName: "Persönlicher 25-Wochen-Lernplan",
    planStartDate: "2026-08-07",
    planEndDate: "2027-02-13",
    totalPlanWeeks: 25,
    dailyCapacityMinutes: 240,
    weeklyGoalMinutes: 1200,
    workdayStart: "09:00",
    restDays: [0, 6],
  },
  accessibility: {
    focusMode: false,
    largerText: false,
    generousLineHeight: true,
    readingRuler: false,
    reducedMotion: false,
  },
  permissions: {
    googleCalendarRead: true,
    gmailRead: false,
    googleDriveRead: true,
  },
  ai: {
    explanationProvider: "openai",
    translationProvider: "deepl",
    targetLanguage: "fa",
  },
  organization: {
    nestedFolders: true,
    defaultProjectFolder: "Projekte",
    sources: [
      { id: "source-github-apps-root-new", name: "APPS_root_new", kind: "github", location: "https://github.com/Hajimohammadi-KI/APPS_root_new", enabled: true },
      { id: "source-drive-research-pdfs", name: "Cross Repository · Forschungs-PDFs", kind: "google_drive", location: "https://drive.google.com/drive/folders/1WDq_TqkacdaQPHSw6kVandumb65_q90D", enabled: true },
      { id: "source-local-project", name: "Lokale Installation", kind: "local", location: "%LOCALAPPDATA%\\CrossRepositoryCodeIntelligence", enabled: true },
    ],
  },
  integration: {
    trustedOrigins: [],
    clients: [],
    notifyOnChange: true,
    links: {
      homeUrl: CURRENT_SITE_ORIGIN,
      settingsUrl: `${CURRENT_SITE_ORIGIN}/settings`,
      embedUrl: `${CURRENT_SITE_ORIGIN}/settings?embed=1`,
      sdkUrl: `${CURRENT_SITE_ORIGIN}/einstellungen.js`,
      apiBaseUrl: `${CURRENT_SITE_ORIGIN}/api`,
      helpUrl: `${CURRENT_SITE_ORIGIN}/settings`,
      googleCallbackUrl: `${CURRENT_SITE_ORIGIN}/api/google/callback`,
      googleJavaScriptOrigin: CURRENT_SITE_ORIGIN,
      googleProjectNumber: "996682910931",
      googleTestUserEmail: "fatemeh.hajimohammadi.DE@gmail.com",
      googleAudienceUrl: "https://console.cloud.google.com/auth/audience?project=quiet-groove-504813-f0",
      googleCredentialsUrl: "https://console.cloud.google.com/auth/clients?project=quiet-groove-504813-f0",
      googleDriveApiUrl: "https://console.cloud.google.com/apis/api/drive.googleapis.com/overview?project=quiet-groove-504813-f0",
      googleCalendarApiUrl: "https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/overview?project=quiet-groove-504813-f0",
      googleGmailApiUrl: "https://console.cloud.google.com/apis/api/gmail.googleapis.com/overview?project=quiet-groove-504813-f0",
    },
  },
  updatedAt: "",
};

const asObject = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const asString = (value: unknown, fallback: string) => typeof value === "string" ? value.slice(0, 500) : fallback;
const asLink = (value: unknown, fallback: string) => {
  const link = asString(value, fallback).trim();
  return LEGACY_CHATGPT_SITE_ORIGIN.test(link)
    ? link.replace(LEGACY_CHATGPT_SITE_ORIGIN, CURRENT_SITE_ORIGIN)
    : link;
};
const asBoolean = (value: unknown, fallback: boolean) => typeof value === "boolean" ? value : fallback;
const asNumber = (value: unknown, fallback: number, min: number, max: number) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

export function normalizeWerkzeugSettings(value: unknown): WerkzeugSettings {
  const root = asObject(value);
  const labels = asObject(root.labels);
  const labelGroups = asObject(labels.groups);
  const labelSections = asObject(labels.sections);
  const labelServices = asObject(labels.services);
  const folderLevels = asObject(labels.folderLevels);
  const labelNavigation = asObject(labels.navigation);
  const labelCards = asObject(labels.cards);
  const profile = asObject(root.profile);
  const planning = asObject(root.planning);
  const accessibility = asObject(root.accessibility);
  const permissions = asObject(root.permissions);
  const ai = asObject(root.ai);
  const organization = asObject(root.organization);
  const integration = asObject(root.integration);
  const links = asObject(integration.links);
  const language = ["de", "en", "fa"].includes(String(profile.language)) ? profile.language as WerkzeugSettings["profile"]["language"] : DEFAULT_WERKZEUG_SETTINGS.profile.language;
  const explanationProvider = ["openai", "none"].includes(String(ai.explanationProvider)) ? ai.explanationProvider as WerkzeugSettings["ai"]["explanationProvider"] : DEFAULT_WERKZEUG_SETTINGS.ai.explanationProvider;
  const translationProvider = ["deepl", "openai", "none"].includes(String(ai.translationProvider)) ? ai.translationProvider as WerkzeugSettings["ai"]["translationProvider"] : DEFAULT_WERKZEUG_SETTINGS.ai.translationProvider;
  const targetLanguage = ["fa", "de", "en"].includes(String(ai.targetLanguage)) ? ai.targetLanguage as WerkzeugSettings["ai"]["targetLanguage"] : DEFAULT_WERKZEUG_SETTINGS.ai.targetLanguage;
  const restDays = Array.isArray(planning.restDays) ? planning.restDays.filter((day): day is number => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6) : DEFAULT_WERKZEUG_SETTINGS.planning.restDays;
  const trustedOrigins = Array.isArray(integration.trustedOrigins)
    ? integration.trustedOrigins.map((origin) => String(origin).trim()).filter((origin) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(origin)).slice(0, 25)
    : DEFAULT_WERKZEUG_SETTINGS.integration.trustedOrigins;
  const allowedGrants: SettingsGrant[] = ["profile", "planning", "accessibility", "permissions", "ai", "organization"];
  const clientList = Array.isArray(integration.clients) ? integration.clients : null;
  const hasClientList = clientList !== null;
  const clients: SettingsClient[] = clientList
    ? clientList.slice(0, 25).map((raw, index) => {
      const client = asObject(raw);
      const grants = Array.isArray(client.grants) ? client.grants.map(String).filter((grant): grant is SettingsGrant => allowedGrants.includes(grant as SettingsGrant)) : allowedGrants;
      return {
        id: asString(client.id, `app-${index + 1}`),
        displayName: asString(client.displayName, `App ${index + 1}`),
        origin: asString(client.origin, ""),
        enabled: asBoolean(client.enabled, true),
        grants: [...new Set(grants)],
      };
    })
    : trustedOrigins.map((origin, index) => ({ id: `legacy-${index + 1}`, displayName: new URL(origin).hostname, origin, enabled: true, grants: allowedGrants }));
  const clientOrigins = clients.filter((client) => client.enabled && /^https?:\/\//i.test(client.origin)).map((client) => client.origin.replace(/\/$/, ""));
  const allowedSourceKinds: ProjectSourceKind[] = ["github", "google_drive", "local"];
  const seenSourceIds = new Set<string>();
  const sources: ProjectSource[] = Array.isArray(organization.sources)
    ? organization.sources.slice(0, 100).map((raw, index) => {
      const source = asObject(raw);
      const kind = allowedSourceKinds.includes(source.kind as ProjectSourceKind) ? source.kind as ProjectSourceKind : "github";
      const requestedId = asString(source.id, `source-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "-") || `source-${index + 1}`;
      let id = requestedId;
      let duplicate = 2;
      while (seenSourceIds.has(id)) id = `${requestedId}-${duplicate++}`;
      seenSourceIds.add(id);
      const fallbackName = kind === "github" ? "GitHub-Repository" : kind === "google_drive" ? "Google-Drive-Ordner" : "Lokaler Ordner";
      return {
        id,
        name: asString(source.name, fallbackName),
        kind,
        location: asString(source.location, ""),
        enabled: asBoolean(source.enabled, true),
      };
    })
    : DEFAULT_WERKZEUG_SETTINGS.organization.sources;

  return {
    version: WERKZEUG_SETTINGS_VERSION,
    labels: {
      appName: asString(labels.appName, DEFAULT_WERKZEUG_SETTINGS.labels.appName),
      appSubtitle: asString(labels.appSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.appSubtitle),
      groups: {
        personal: asString(labelGroups.personal, DEFAULT_WERKZEUG_SETTINGS.labels.groups.personal),
        work: asString(labelGroups.work, DEFAULT_WERKZEUG_SETTINGS.labels.groups.work),
        services: asString(labelGroups.services, DEFAULT_WERKZEUG_SETTINGS.labels.groups.services),
        organization: asString(labelGroups.organization, DEFAULT_WERKZEUG_SETTINGS.labels.groups.organization),
        data: asString(labelGroups.data, DEFAULT_WERKZEUG_SETTINGS.labels.groups.data),
      },
      sections: {
        profile: asString(labelSections.profile, DEFAULT_WERKZEUG_SETTINGS.labels.sections.profile),
        planning: asString(labelSections.planning, DEFAULT_WERKZEUG_SETTINGS.labels.sections.planning),
        accessibility: asString(labelSections.accessibility, DEFAULT_WERKZEUG_SETTINGS.labels.sections.accessibility),
        permissions: asString(labelSections.permissions, DEFAULT_WERKZEUG_SETTINGS.labels.sections.permissions),
        organization: asString(labelSections.organization, DEFAULT_WERKZEUG_SETTINGS.labels.sections.organization),
        sharing: asString(labelSections.sharing, DEFAULT_WERKZEUG_SETTINGS.labels.sections.sharing),
        backup: asString(labelSections.backup, DEFAULT_WERKZEUG_SETTINGS.labels.sections.backup),
      },
      services: {
        google: asString(labelServices.google, DEFAULT_WERKZEUG_SETTINGS.labels.services.google),
        calendar: asString(labelServices.calendar, DEFAULT_WERKZEUG_SETTINGS.labels.services.calendar),
        gmail: asString(labelServices.gmail, DEFAULT_WERKZEUG_SETTINGS.labels.services.gmail),
        drive: asString(labelServices.drive, DEFAULT_WERKZEUG_SETTINGS.labels.services.drive),
        openai: asString(labelServices.openai, DEFAULT_WERKZEUG_SETTINGS.labels.services.openai),
        deepl: asString(labelServices.deepl, DEFAULT_WERKZEUG_SETTINGS.labels.services.deepl),
      },
      folderLevels: {
        project: asString(folderLevels.project, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.project),
        subproject: asString(folderLevels.subproject, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.subproject),
        topic: asString(folderLevels.topic, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.topic),
        material: asString(folderLevels.material, DEFAULT_WERKZEUG_SETTINGS.labels.folderLevels.material),
      },
      navigation: {
        workspace: asString(labelNavigation.workspace, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.workspace),
        calendar: asString(labelNavigation.calendar, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.calendar),
        calendarSubtitle: asString(labelNavigation.calendarSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.calendarSubtitle),
        programEntries: asString(labelNavigation.programEntries, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.programEntries),
        mail: asString(labelNavigation.mail, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.mail),
        mailSubtitle: asString(labelNavigation.mailSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.mailSubtitle),
        notes: asString(labelNavigation.notes, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.notes),
        notesSubtitle: asString(labelNavigation.notesSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.notesSubtitle),
        connections: asString(labelNavigation.connections, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.connections),
        connectionsSubtitle: asString(labelNavigation.connectionsSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.connectionsSubtitle),
        centralSettings: asString(labelNavigation.centralSettings, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.centralSettings),
        centralSettingsSubtitle: asString(labelNavigation.centralSettingsSubtitle, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.centralSettingsSubtitle),
        standaloneApp: asString(labelNavigation.standaloneApp, DEFAULT_WERKZEUG_SETTINGS.labels.navigation.standaloneApp),
      },
      cards: {
        centralSettings: asString(labelCards.centralSettings, DEFAULT_WERKZEUG_SETTINGS.labels.cards.centralSettings),
        jsonImport: asString(labelCards.jsonImport, DEFAULT_WERKZEUG_SETTINGS.labels.cards.jsonImport),
        embed: asString(labelCards.embed, DEFAULT_WERKZEUG_SETTINGS.labels.cards.embed),
        integrationApi: asString(labelCards.integrationApi, DEFAULT_WERKZEUG_SETTINGS.labels.cards.integrationApi),
      },
    },
    profile: {
      displayName: asString(profile.displayName, DEFAULT_WERKZEUG_SETTINGS.profile.displayName),
      language,
      timezone: asString(profile.timezone, DEFAULT_WERKZEUG_SETTINGS.profile.timezone),
      humanAvatar: asBoolean(profile.humanAvatar, DEFAULT_WERKZEUG_SETTINGS.profile.humanAvatar),
    },
    planning: {
      projectName: asString(planning.projectName, DEFAULT_WERKZEUG_SETTINGS.planning.projectName),
      planName: asString(planning.planName, DEFAULT_WERKZEUG_SETTINGS.planning.planName),
      planStartDate: /^\d{4}-\d{2}-\d{2}$/.test(String(planning.planStartDate)) ? String(planning.planStartDate) : DEFAULT_WERKZEUG_SETTINGS.planning.planStartDate,
      planEndDate: /^\d{4}-\d{2}-\d{2}$/.test(String(planning.planEndDate)) ? String(planning.planEndDate) : DEFAULT_WERKZEUG_SETTINGS.planning.planEndDate,
      totalPlanWeeks: asNumber(planning.totalPlanWeeks, DEFAULT_WERKZEUG_SETTINGS.planning.totalPlanWeeks, 1, 104),
      dailyCapacityMinutes: asNumber(planning.dailyCapacityMinutes, DEFAULT_WERKZEUG_SETTINGS.planning.dailyCapacityMinutes, 30, 960),
      weeklyGoalMinutes: asNumber(planning.weeklyGoalMinutes, DEFAULT_WERKZEUG_SETTINGS.planning.weeklyGoalMinutes, 30, 6000),
      workdayStart: /^\d{2}:\d{2}$/.test(String(planning.workdayStart)) ? String(planning.workdayStart) : DEFAULT_WERKZEUG_SETTINGS.planning.workdayStart,
      restDays: [...new Set(restDays)],
    },
    accessibility: {
      focusMode: asBoolean(accessibility.focusMode, DEFAULT_WERKZEUG_SETTINGS.accessibility.focusMode),
      largerText: asBoolean(accessibility.largerText, DEFAULT_WERKZEUG_SETTINGS.accessibility.largerText),
      generousLineHeight: asBoolean(accessibility.generousLineHeight, DEFAULT_WERKZEUG_SETTINGS.accessibility.generousLineHeight),
      readingRuler: asBoolean(accessibility.readingRuler, DEFAULT_WERKZEUG_SETTINGS.accessibility.readingRuler),
      reducedMotion: asBoolean(accessibility.reducedMotion, DEFAULT_WERKZEUG_SETTINGS.accessibility.reducedMotion),
    },
    permissions: {
      googleCalendarRead: asBoolean(permissions.googleCalendarRead, DEFAULT_WERKZEUG_SETTINGS.permissions.googleCalendarRead),
      gmailRead: asBoolean(permissions.gmailRead, DEFAULT_WERKZEUG_SETTINGS.permissions.gmailRead),
      googleDriveRead: asBoolean(permissions.googleDriveRead, DEFAULT_WERKZEUG_SETTINGS.permissions.googleDriveRead),
    },
    ai: { explanationProvider, translationProvider, targetLanguage },
    organization: {
      nestedFolders: asBoolean(organization.nestedFolders, DEFAULT_WERKZEUG_SETTINGS.organization.nestedFolders),
      defaultProjectFolder: asString(organization.defaultProjectFolder, DEFAULT_WERKZEUG_SETTINGS.organization.defaultProjectFolder),
      sources,
    },
    integration: {
      trustedOrigins: [...new Set(hasClientList ? clientOrigins : [...trustedOrigins, ...clientOrigins])],
      clients,
      notifyOnChange: asBoolean(integration.notifyOnChange, DEFAULT_WERKZEUG_SETTINGS.integration.notifyOnChange),
      links: {
        homeUrl: asLink(links.homeUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.homeUrl),
        settingsUrl: asLink(links.settingsUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.settingsUrl),
        embedUrl: asLink(links.embedUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.embedUrl),
        sdkUrl: asLink(links.sdkUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.sdkUrl),
        apiBaseUrl: asLink(links.apiBaseUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.apiBaseUrl),
        helpUrl: asLink(links.helpUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.helpUrl),
        googleCallbackUrl: asLink(links.googleCallbackUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCallbackUrl),
        googleJavaScriptOrigin: asLink(links.googleJavaScriptOrigin, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleJavaScriptOrigin),
        googleProjectNumber: asString(links.googleProjectNumber, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleProjectNumber),
        googleTestUserEmail: asString(links.googleTestUserEmail, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleTestUserEmail),
        googleAudienceUrl: asLink(links.googleAudienceUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleAudienceUrl),
        googleCredentialsUrl: asLink(links.googleCredentialsUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCredentialsUrl),
        googleDriveApiUrl: asLink(links.googleDriveApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleDriveApiUrl),
        googleCalendarApiUrl: asLink(links.googleCalendarApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleCalendarApiUrl),
        googleGmailApiUrl: asLink(links.googleGmailApiUrl, DEFAULT_WERKZEUG_SETTINGS.integration.links.googleGmailApiUrl),
      },
    },
    updatedAt: asString(root.updatedAt, ""),
  };
}

export function isTrustedOrigin(settings: WerkzeugSettings, origin: string, ownOrigin: string) {
  return origin === ownOrigin || settings.integration.clients.some((client) => client.enabled && client.origin.replace(/\/$/, "") === origin) || settings.integration.trustedOrigins.includes(origin);
}

export function settingsForClient(settings: WerkzeugSettings, origin: string, requested?: string[]) {
  if (typeof location !== "undefined" && origin === location.origin) return settings;
  const client = settings.integration.clients.find((entry) => entry.enabled && entry.origin.replace(/\/$/, "") === origin);
  const grants = client?.grants ?? [];
  const allowed = requested?.length ? grants.filter((grant) => requested.includes(grant)) : grants;
  const result: Record<string, unknown> = { version: settings.version, labels: settings.labels, links: settings.integration.links, updatedAt: settings.updatedAt };
  allowed.forEach((grant) => { result[grant] = settings[grant]; });
  return result;
}
