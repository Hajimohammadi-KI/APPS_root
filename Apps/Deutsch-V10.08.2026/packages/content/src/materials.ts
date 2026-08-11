export interface DriveMaterialCollection {
  readonly id: string;
  readonly title: string;
  readonly level: string;
  readonly kind: "course" | "practice" | "audio" | "reference";
  readonly description: string;
  readonly assetSummary: string;
  readonly url: string;
}

export interface DriveMaterialItem {
  readonly id: string;
  readonly title: string;
  readonly level: string;
  readonly format: "PDF" | "Audio" | "Video" | "Ordner" | "Archiv";
  readonly url: string;
}

export interface GrammarTrainingPart {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly folderUrl: string;
  readonly items: readonly DriveMaterialItem[];
}

export const driveMaterialFolderUrl =
  "https://drive.google.com/drive/folders/1isE3OWBFZcr9eRDwWvNXHWb5vo0qmGAF?usp=drive_link";

export const deutschMitMarijaSourceFolders = [
  {
    id: "marija-grammar",
    title: "Grammatiktraining B2–C1 öffnen",
    description: "Vier vollständige 30-Tage-Teile",
    url: "https://drive.google.com/drive/folders/1w7QJaMHkH-mVYSXBxDw9nwd_FTVVLIUS?usp=drive_link",
  },
  {
    id: "marija-conversation",
    title: "Konversationen und Vorträge öffnen",
    description: "Handouts, Erklärvideo und Hörmodelle",
    url: "https://drive.google.com/drive/folders/1l8nQtv35TEUeYpJA10SoUAhldSK53LBe?usp=drive_link",
  },
  {
    id: "marija-idioms",
    title: "Redewendungen und Zitate öffnen",
    description: "24-Tage-Training B2–C2",
    url: "https://drive.google.com/drive/folders/1jzgBp3kP8nTT_bqL9RlNMuFtZkpdm3Q8?usp=drive_link",
  },
] as const;

export const deutschMitMarijaSharedWithMeUrl =
  deutschMitMarijaSourceFolders[0].url;

/**
 * Curated entry points cover every distinct material family in the supplied
 * folder. Duplicate compressed/merged copies are intentionally represented by
 * one learner-facing entry instead of being shown twice.
 */
export const driveMaterialCollections = [
  {
    id: "begegnungen-a1",
    title: "Begegnungen A1",
    level: "A1",
    kind: "course",
    description:
      "Grundkurs für Alltagssprache, erste Satzmuster, Wortschatz und Grammatik.",
    assetSummary: "Kurs- und Übungsbuch · PDF",
    url: "https://drive.google.com/file/d/1TV1AAAHkng5USBOeewMc3NpHFk97eMwi/view",
  },
  {
    id: "begegnungen-a2",
    title: "Begegnungen A2",
    level: "A2",
    kind: "course",
    description:
      "Aufbaukurs mit Zeitformen, Nebensätzen, Rektion und kommunikativen Übungen.",
    assetSummary: "Vollbuch plus Lektionen 1–4 · PDF",
    url: "https://drive.google.com/file/d/15ro9J-QvKB7-T71fJiMi_lzoRsGfuZtT/view",
  },
  {
    id: "begegnungen-b1-plus",
    title: "Begegnungen B1+",
    level: "B1–B2",
    kind: "course",
    description:
      "Vertiefung für selbstständige Sprachverwendung und komplexere Grammatik.",
    assetSummary: "Kurs- und Übungsbuch · PDF",
    url: "https://drive.google.com/file/d/18A4xXhZwsCusuZ1Nt0GnIndXgQEZFQAe/view",
  },
  {
    id: "erkundungen-b2",
    title: "Erkundungen B2",
    level: "B2",
    kind: "course",
    description:
      "Kursmaterial für B2-Satzbau, Textarbeit und systematische Grammatikpraxis.",
    assetSummary: "Kurs- und Übungsbuch · PDF",
    url: "https://drive.google.com/file/d/1oFEA0rTlQVoEDzodWprYWMXP82UtHrva/view",
  },
  {
    id: "b2-error-training",
    title: "B2 · Finde die Fehler",
    level: "B2–C1",
    kind: "practice",
    description:
      "Fehlersuche und Korrekturtraining als Quelle für persönliche Reparaturschleifen.",
    assetSummary: "Fehlertraining 2022 · PDF",
    url: "https://drive.google.com/file/d/1PAG6_iFv3g3p0t6JiPbN95pMhR-cTueN/view",
  },
  {
    id: "crashkurs-fehlerfrei",
    title: "Crashkurs fehlerfrei · Bonusmaterial",
    level: "B1–C1",
    kind: "practice",
    description:
      "Kompaktes Zusatzmaterial für häufige Fehler und sprachliche Genauigkeit.",
    assetSummary: "Bonusmaterial · PDF",
    url: "https://drive.google.com/file/d/1RYtQTyn4LIeGqvTJEbwAqm64XmrjY5rR/view",
  },
  {
    id: "b2-c1-grammar-120-days",
    title: "B2–C1 Grammatiktraining",
    level: "B2–C1",
    kind: "practice",
    description:
      "Vier aufeinander aufbauende 30-Tage-Teile mit Tests, Fehleraufgaben und Transfermaterial.",
    assetSummary: "4 × 30 Tage plus Bonus- und Zusatzmaterial",
    url: deutschMitMarijaSourceFolders[0].url,
  },
  {
    id: "idioms-24-days",
    title: "Redewendungen, Sprichwörter & Zitate",
    level: "B2–C2",
    kind: "practice",
    description:
      "24-Tage-Training für Idiomatik, Zitieren, Interpretation und stilistischen Transfer.",
    assetSummary: "24 Tageslektionen",
    url: deutschMitMarijaSourceFolders[2].url,
  },
  {
    id: "c1-discussions",
    title: "Diskussionen meistern",
    level: "C1",
    kind: "audio",
    description:
      "Vorbereitung, Perspektivwechsel, Redemittel und sieben authentische Diskussionsbeispiele.",
    assetSummary: "4 Handouts · 1 Video · 7 Audios",
    url: deutschMitMarijaSourceFolders[1].url,
  },
  {
    id: "marija-conversation-building-blocks",
    title: "Konversationsbausteine · Deutschkurs",
    level: "C1",
    kind: "reference",
    description:
      "Redemittel und klare Bausteine für strukturierte Diskussionen und Vorträge.",
    assetSummary: "Kurs-Handout · PDF",
    url: "https://drive.google.com/file/d/1MEdEk4YwGerRsA_zxKV_8X6nv0RSqOuH/view",
  },
] as const satisfies readonly DriveMaterialCollection[];

export const idiomDailyMaterials = [
  [
    "1",
    "Redewendungen: Erfolg, Gefallen und Misserfolg",
    "1x1TfLy_Az6Ztd0HBO52exAEh2FmptFxZ",
  ],
  [
    "2",
    "Sprichwörter: Erklärungen und Übungen",
    "1vuVLyciXdP0Z-m1wmJbI8pOgOfCBPdd9",
  ],
  [
    "3",
    "Schriftliches und mündliches Zitieren",
    "1_FIp1r2uSyUQWEHI6l6Ph64b8eCbu3tG",
  ],
  ["4", "Mündliches Zitieren", "14he0W4FCxfHzgpCtYb5Ez2jmzYwiMhgz"],
  ["5", "Ein Zitat interpretieren", "1UCC9bN3a0h4XVGqTSHSJHdc84lLp41SK"],
  ["6", "Redewendungen mit Farben", "1dO-1AnD_EWtmpR7Zs2v6H70ISWr1DDvM"],
  ["7", "Redewendungen-Quiz", "1mJeB3YCd8zJ-PazRwtrdzB9pYONxWkYW"],
  ["8", "Zitate von Richard David Precht", "1SySweBLCslzaVeHe6G1Heh6RulUbxe8x"],
  ["9", "Zitate: Erklärungen und Übungen", "1zoT_MQAi5Al2sMklBdU__eKApKJMb6ze"],
  ["10", "Wiederholung 1", "1HVXUNhE7FTsdw4yh8VmLMOTRAGeZVS7b"],
  ["11", "Sprichwörter zuordnen", "1KYAOTVARcZwd2lRLOQg45emy4uKDK1xc"],
  ["12", "Redewendungen mit Körperteilen", "1nCq1u-rg2z8tdL382BIIZvUzaw3aeR83"],
  ["13", "Zitate zuordnen", "194dyL7ooVVOK9PE27Rh9fZxXNmW-iBgZ"],
  ["14", "Da-Vinci-Zitat interpretieren", "18lb5En2SQ0WFhPNfmSQFdkQsGnI-ZaiD"],
  [
    "15",
    "Kierkegaard-Zitat interpretieren",
    "1pWF4XUXrx9a5h1trEWrMvb2W7TKbTuRa",
  ],
  ["16", "Redewendung und Situation", "1M88nmre7bY3WJDHCBWBv6ySDd8ftphFQ"],
  [
    "17",
    "Sprüche auf T-Shirts und Tassen · Teil 1",
    "1OEMs01nyfCen9R7Q6cSmaKERvEPQAcZl",
  ],
  [
    "18",
    "Sprüche auf T-Shirts und Tassen · Teil 2",
    "1ig_usr-tU_mJKK-5rz3B3QCgCCv_sBSP",
  ],
  ["19", "Redewendungen mit Gewürzen", "1Glw9FYTzk7NhKwCBBFl11OWn0d710gTp"],
  ["20", "Zitate-Quiz · Teil 1", "1_J2tqQoCqcLumd2bHfqAqE3d9PxzV62K"],
  ["21", "Zitate-Quiz · Teil 2", "1U6ToAVxLK9Bei_epELERJAzhaEz0PDc7"],
  ["22", "Gemischte Redewendungen", "1fq53sadv5ObgT30AQLi5m-Yles_L2_8z"],
  ["23", "Idiomatische Ausdrücke", "1qzzELX2UZkz0lJyvCJ2My4Ej8DQ5Ga0E"],
  ["24", "Redewendungs-Challenge", "1wcAU8dgwEyO9aGr2DE2LX4pDaOireAtM"],
].map(([day, title, id]) => ({
  id: `idiom-day-${day}`,
  title: `Tag ${day} · ${title}`,
  level: "B2–C2",
  format: "PDF" as const,
  url: `https://drive.google.com/file/d/${id}/view`,
})) satisfies readonly DriveMaterialItem[];

export const discussionAudioMaterials = [
  [
    "Land oder Stadt – wo lebt es sich besser?",
    "1eXcYviBSBXnuhHqFRU4dCW_Al0nE7xhY",
  ],
  ["Hochbegabung – Fluch oder Segen?", "1QyjG9wqm8qLXV4XB90KCWMoN5D1Eo41Y"],
  [
    "Erneuerbare Energien und Energiewende",
    "1Sfey2ccRuNcbwOFHnOYflujYtUY11uzy",
  ],
  ["Autofreie Städte", "1CZ59w7QNAwqvSGkV3P4zddwY4gwYTTtU"],
  ["E-Book oder gedrucktes Buch?", "111Y2lkfsZdQuqu0CuEIntv3o_p7aDipZ"],
  [
    "Rauchverbot in öffentlichen Bereichen",
    "1YmSzSQamptFJfo0f5vKSzZNvoHuAVSj8",
  ],
  ["Das Tragen von Pelzen", "10oyYTl6eUVdX7tEQUIEYn9YQkmy9lFO1"],
].map(([title, id], index) => ({
  id: `discussion-audio-${index + 1}`,
  title: title!,
  level: "C1",
  format: "Audio" as const,
  url: `https://drive.google.com/file/d/${id}/view`,
})) satisfies readonly DriveMaterialItem[];

export const discussionGuideMaterials = [
  {
    id: "discussion-guide-1",
    title: "Eine Konversation oder einen Vortrag vorbereiten",
    level: "C1",
    format: "PDF",
    url: "https://drive.google.com/file/d/1XbH05KKYcuqlUo9KBisUknHu9Il201--/view",
  },
  {
    id: "discussion-guide-2",
    title: "7+1 Perspektiven bei einer Konversation oder einem Vortrag",
    level: "C1",
    format: "PDF",
    url: "https://drive.google.com/file/d/1lt9DhXRWHMPfIFBemQZhPfCDozllhjBN/view",
  },
  {
    id: "discussion-guide-3",
    title: "Erweiterte Redemittel in einer Konversation",
    level: "C1",
    format: "PDF",
    url: "https://drive.google.com/file/d/11PdA6P8n-MzPRKAgfl8ZpPg0YshPw6R2/view",
  },
  {
    id: "discussion-guide-4",
    title: "Konversationsbausteine · Deutschkurs",
    level: "C1",
    format: "PDF",
    url: "https://drive.google.com/file/d/1MEdEk4YwGerRsA_zxKV_8X6nv0RSqOuH/view",
  },
  {
    id: "discussion-guide-video",
    title: "Erklärvideo · Konversation oder Vortrag vorbereiten",
    level: "C1",
    format: "Video",
    url: "https://drive.google.com/file/d/1J8ABRaV3sDM6ymhSedr2eTN4_5DgFHLJ/view",
  },
] as const satisfies readonly DriveMaterialItem[];

export const grammarTrainingParts = [
  {
    id: "grammar-training-part-1",
    title: "Teil 1 · 30 Tage plus Bonustage 31–32",
    level: "B2–C1",
    format: "Ordner",
    url: "https://drive.google.com/drive/folders/1xwsKM6UkXhAO4311g2uSMSVP_iw29aEX",
  },
  {
    id: "grammar-training-part-2",
    title: "Teil 2 · 30 Tage plus Bonus- und Zusatzmaterial",
    level: "B2–C1",
    format: "Ordner",
    url: "https://drive.google.com/drive/folders/15EYvz6oXS6parXzJQPECxDZaFc42VYyU",
  },
  {
    id: "grammar-training-part-3",
    title: "Teil 3 · 30 Tage plus Fehlertraining",
    level: "B2–C1",
    format: "Ordner",
    url: "https://drive.google.com/drive/folders/1l3xxN1CbVKHFNmvB2OTkibywgNb98qqE",
  },
  {
    id: "grammar-training-part-4",
    title: "Teil 4 · 30 Tage plus Tests, Lösungen und Zusatzmaterial",
    level: "B2–C1",
    format: "Ordner",
    url: "https://drive.google.com/drive/folders/1oygvDZq79Xf2waWdgaPu5JwjdGiMhMqy",
  },
] as const satisfies readonly DriveMaterialItem[];

const drivePdf = (
  part: number,
  key: string,
  title: string,
  id: string,
): DriveMaterialItem => ({
  id: `grammar-training-${part}-${key}`,
  title,
  level: "B2–C1",
  format: "PDF",
  url: `https://drive.google.com/file/d/${id}/view`,
});

const driveArchive = (part: number, id: string): DriveMaterialItem => ({
  id: `grammar-training-${part}-archive`,
  title: `Teil ${part} · Originalarchiv`,
  level: "B2–C1",
  format: "Archiv",
  url: `https://drive.google.com/file/d/${id}/view`,
});

const grammarPart1DayIds = [
  "1i_4i3_D8OgePKSw2bAzouaYhfsgizQgR",
  "1Qmobl1OiskC_tX4tnFqfo0npWmTo5IuR",
  "1UvOxdwnd11hL-EYffjjq_ogYKyoQWLbB",
  "1uaWOWpbv_iZ3bwOvCVEUr1H3qCsC8TKu",
  "1rdze7nO_jJn7BGrZKNSpxoxOPZaBBe94",
  "1KlkHZWVX4Xp853dAzkHOBymVUqWSzMdV",
  "1hV5jLVc9bNnJXdnPSkTiMf22gXqzr0xr",
  "1s5s0JH0sYPUpmjgJ9omAttv5IvZCMCLp",
  "1qKCwcrKYEsJ_imZaAHG5eD98bhQ9yot3",
  "173ajN9r9LSJm09P2xZnqKlXaYgdH7IXl",
  "1jk3Fp3Q4bWMqXH5wdPR7HQQkNf93TBB4",
  "1MX60f_WC_wYz7MqEYJunDocEKZbSI08O",
  "1ld_FIyoK_nn6Bbi2CFHmXA_cH3fe2viw",
  "1uwPBW5L8si4uGmqZU60mmlEPwgWSm7Ey",
  "16rbDiMn6s3yYxo3W-ru-oDYZgeVCFnHM",
  "1fQGnjPNneKfoajVmmuCh4LDgM4Qs0zeO",
  "1YuJPDhEzUihL1ihHDDzaxO3n9LPI6xtu",
  "1zzF2IUDKBK1Dx7ueroP1YHmoze35FMJ0",
  "1WmGModsDyQOMmsVywZcfQ2Pi3UC067gj",
  "1jhlk6y3osfXDLHwr6dFTCeiB-PXXCBLJ",
  "1qF1YXGZvDRep58dl-Rwv345fDyh-wbcd",
  "1jAimquGfww7XQeqJf-tG_EF3ZzqhGfCU",
  "176opGO9TqN3MzMX79soz9rkhnY3Ghl5M",
  "1peIJnsRJkNX8EuRGYlOGFULbZUFIunP1",
  "14mSuefSitEmhG_LW6MJ-Wlnr1IQ2zLLN",
  "1lFVghtzJe97WzhHDX8dfkX5jgWdXfir1",
  "1N3jlghUpyyNOK3pho0xZmIJ7f56qVyP4",
  "1Kw9QMgzMOjEzZfa_N3Yt_aYHSCiimwEk",
  "1WtSw1n9YvlLilgfYMxXW7KF3ViAO4uRJ",
  "1Gh0BBeZ2biBF9anL6AJJuzQAEzpSrGui",
] as const;

const grammarPart2DayIds = [
  "1E_UyxT5TPyc8YkIdy5-n5cfcYnEqTZKx",
  "1eNQd1NQFEdUfopMf7hWa4rVVZlR_y7o3",
  "1wqVuABFRPlrFgv8HZTaYwCrOu6t8dExj",
  "1kOZCeVOcdURqckyKPZUABRcKtsKeeeZW",
  "1PaQoQRBfHGUWrnKzkdzDfM5JfqI-ct1d",
  "1WbmCymMUgz7-VIB7qTwRzr_JnRBVXJbJ",
  "1fwJCRNrNLpFz1ja_HGO-4dtcqrymTUg4",
  "15ZwQY4zrJxs39krOk_hV93SCOg2JyIf2",
  "192WhONWe0gsU0OPCHvdrbo6aOH3v502j",
  "14gh8wBuVxRJZENJAuNCzVJE7XPQRR4X0",
  "1LzJk5ET9JOIF1Q-83BGIwQDBABpXmJ0n",
  "1X22cj6sASZPsYJCLzW3IppRqhLPSJvWY",
  "1gYlHqrCI1doOYrawjvvrqEHpD5LLfYmr",
  "1649S8cCL5JOJgFKcY4PeRvt_kZx94Yro",
  "1hQ5iwj0QLW3QZbWs4KQz9W62HhnBCZ47",
  "1tfTHbdQLspuppw4no7rrhrvR_LB4aQmL",
  "1FH9V_oDNmUmZP5yZURKgbfxu6LPZ9EEH",
  "1JQK3D23itcWdI4bejOkbdwXWXmwD3wzi",
  "1JdxRf12Dow695XgSIwx-Ea50ZGdBRHfZ",
  "1B36rF_JzAkZrTe2Qamj6XcpIcZ31Ch2M",
  "1A9tNsgAx7ODlYZShxLMawHGVGjEAw07D",
  "1clb-xBdEVMxmQmccadH2LeXiLrxh6YBj",
  "1L0eNW2LmvrLgtNlyoMVbHpLFuYeu0GDa",
  "1U3VAcf6X99JbyjKjPr7dpFtZOapwO0ii",
  "1iM-w9WkPXY3qgXwIIHUadcdSQeTg0jha",
  "1qkfR3Iukv5Q7N2VZ_1Xu9gkTD1wygkJI",
  "1wmanbt2h9_LQkJgBLBv6cm6QTEgPpUDe",
  "1NITMkxFyQVs7jswCxXL9VwmnY5pOrSXi",
  "1v-3LQYT7raaULclo3-nr_BhGxh3iBztw",
  "1TxqF5fui2VGXtX3CAeZP0XMz1O9AQk0K",
] as const;

const grammarPart3DayIds = [
  "19qEjGUS-VXjcT9W9zVM6wqvpyVHWC0Hk",
  "1dL_gLaDrUZj7xiQJU3hyjhDAxdRdQev_",
  "1CFrVF1FFtNDYn4g836NlMAZ9KnrN4AOc",
  "1pAf4QONm9iqNvqBrwwVuEOItoar923Vv",
  "1jbXpLQ6P2z2gnpRdYo0uf-r2q_UmF7Kp",
  "1dPQyg0tk8o37hHS_-2-wHcT3PHPtOxyv",
  "10CoEIpNgr0Vtz4aeFLClRQwLvRja5DfD",
  "1u42cBjMOGNiTOjCPW5jdI2dlvcATWyRb",
  "1-cxiwjBnnwC7WET1e2BZOj90q3k5p-O4",
  "1yLzhx9qcBw3Br6a-OWuXMMfDlhB0t5g1",
  "1Vsp6ko06_m8z0GzWtdHyrwodOoZfcera",
  "1wKMEXc4web8dw2SgFZGRSwd63ks5IDBi",
  "19cKutahcUFoMnpHUP7ZjZ4Z2FZ-S7j6R",
  "1x05KXv7R0dDnd5bMp1V6Qni9y42l60sI",
  "18Snyfv8X_OocYRyB3H5Puj0Zcr7nekL4",
  "1phr7V-jDj6tsYufcDv_2DA48Tgv3Ti-y",
  "1gAfnnPrcd3JWuxOuWrelNt9ihm_WNoS_",
  "1wLlXIiXC3odwVcozQdndC8edSvrpIERO",
  "1AgyP8WZ7rb6m9MMQSt8Us0AJbtHQibDQ",
  "1JtSea_YC6FyexJFPB1KXKuN18DRWWUrS",
  "1x6U-B9SgM8IMV2UiVxy1d_1ZWtu-IXbm",
  "1Qy1DgIn79315N28C9r9mSpgl0WVAJU18",
  "10t7bf1gs_svxHSHM6rrTvRjTwKbD6ihT",
  "1R9p4NK4szYmkfArqKIbFes6PEfIQpZxu",
  "1GpqWjn-Y73qPVNU-Yb0XqoxyA2uIPTm2",
  "1CRNZeoJxjKQJSeBZfs_q8xhi5ITJz6JL",
  "1iZTOKj3lkZl1iUCWg9hzW4pkVIa4YJai",
  "1XYA1-oTkDwZp69bzU9qXYySlYXihC_9G",
  "1vIS__7U51rnvtFFG6x2fkj5ACjkn6j0W",
  "1_-7hgWdPTOecdIq1tnc-fhX8RuL_6iYP",
] as const;

const dailyMaterials = (
  part: number,
  ids: readonly string[],
): readonly DriveMaterialItem[] =>
  ids.map((id, index) =>
    drivePdf(
      part,
      `day-${index + 1}`,
      `Teil ${part} · Tag ${index + 1}${
        part === 3 && index === 20 ? " · Finde die Fehler" : ""
      }`,
      id,
    ),
  );

const grammarPart1Materials = [
  ...dailyMaterials(1, grammarPart1DayIds),
  drivePdf(
    1,
    "bonus-31",
    "Teil 1 · Bonustag 31",
    "1qBCC_qCyjXKKFw-c31VqOqS7FhXeq3ZX",
  ),
  drivePdf(
    1,
    "bonus-32",
    "Teil 1 · Bonustag 32",
    "1lD6MXvuGr1ZirPejNbqO_jmTmLo8EHET",
  ),
  driveArchive(1, "1Y8aLlxr3OmA-DQaTaL0d7np9eCf3hCCL"),
] as const;

const grammarPart2Materials = [
  ...dailyMaterials(2, grammarPart2DayIds),
  drivePdf(
    2,
    "day-22-supplement",
    "Teil 2 · Tag 22 · Zusatzmaterial Konjunktiv I und II",
    "1OacdTqNp_58yQ38dBb0ElFlmgVrFJxNM",
  ),
  drivePdf(
    2,
    "bonus-31",
    "Teil 2 · Bonustag 31",
    "1loiol1gyU2Gg1A2JgvWaQ88VvzvJFe9T",
  ),
  drivePdf(
    2,
    "bonus-32",
    "Teil 2 · Bonustag 32",
    "16IyDY0aBYLmNL11p7kPhIDmj6ubBApod",
  ),
  driveArchive(2, "1JwhHnm3Z_7CkLP2zRr8NnxCqtvCYcVL9"),
] as const;

const grammarPart3Materials = [
  ...dailyMaterials(3, grammarPart3DayIds),
  driveArchive(3, "14CuKUOPsbTjch7PysdYjw9C3j_Z--lef"),
] as const;

const grammarPart4Materials = [
  drivePdf(4, "day-1", "Teil 4 · Tag 1", "1oBBi1A22amhmGyJpYtE2lCj_maRMlRk9"),
  drivePdf(4, "day-2", "Teil 4 · Tag 2", "1Ht3NudqRWg0KvUne8kJq_ynva7koHaxg"),
  drivePdf(
    4,
    "day-3-test",
    "Teil 4 · Tag 3 · Test",
    "1jYqspvwDDmWENd1Ag9gC4XLGbLYpjNMI",
  ),
  drivePdf(
    4,
    "day-3-solution",
    "Teil 4 · Tag 3 · Lösung",
    "1N5WJNNghttslRTaXkHs4gb4_dBJFjW9h",
  ),
  drivePdf(4, "day-4", "Teil 4 · Tag 4", "1iHO8zY5TfIMZ5Yu3TJgZ7I8jG_SOocaF"),
  drivePdf(
    4,
    "day-5-errors",
    "Teil 4 · Tag 5 · Finde die Fehler",
    "1Pj7vYpRcdjMAxnIxiMfVS29DE9d_x8iq",
  ),
  drivePdf(4, "day-6", "Teil 4 · Tag 6", "1OD3ZDAdk2jsddqGMV2cg9OFxprQGwlVe"),
  drivePdf(4, "day-7", "Teil 4 · Tag 7", "1VquIfH_mb_lTI0eDGI4xc_VynlBHtluf"),
  drivePdf(4, "day-8", "Teil 4 · Tag 8", "15rabcLM-59Ihzm0n9B3XfiVmYXE0SJ51"),
  drivePdf(4, "day-9", "Teil 4 · Tag 9", "1SlspxhQrMJ2jHbAOoImQsmmjKoHACE69"),
  drivePdf(4, "day-10", "Teil 4 · Tag 10", "1x10Xwfikg9B42KX_afimWELCAvWOwPc0"),
  drivePdf(4, "day-11", "Teil 4 · Tag 11", "1U5gpkLtI4_Zl2fkwsPWm_cstySIhTSol"),
  drivePdf(
    4,
    "day-12-barilla",
    "Teil 4 · Tag 12 · Sprachbausteine Barilla/Spotify",
    "1KFSL0my6WXmkvNQJ_ZnMy46P0txDGv_3",
  ),
  drivePdf(
    4,
    "day-12-hospitality",
    "Teil 4 · Tag 12 · Sprachbausteine Hotellerie/Gastronomie",
    "1N5g4r_A7KFBDOI-52KYbgskXa8vDpf6T",
  ),
  drivePdf(4, "day-13", "Teil 4 · Tag 13", "1obcfc2s1UveaACiuTSocGsTjAyLMydLN"),
  drivePdf(4, "day-14", "Teil 4 · Tag 14", "1pOTt_mqD0Z_SSj4Le8yFKcSdRQJnJkQl"),
  drivePdf(4, "day-15", "Teil 4 · Tag 15", "1RhooRXotE82uaES8vTlaOl84xxxIePSA"),
  drivePdf(4, "day-16", "Teil 4 · Tag 16", "1IpaTq6raP9cILntXJG_lcUY7K6M_y2TR"),
  drivePdf(4, "day-17", "Teil 4 · Tag 17", "1yzw1p-LFosFGOTZQVQ4D7lHHH6C-6rkh"),
  drivePdf(4, "day-18", "Teil 4 · Tag 18", "1ER-4nvz4wUP25Mtiu8IriiZYsf1rd7LX"),
  drivePdf(4, "day-19", "Teil 4 · Tag 19", "1p8FFX9yCQYbyk7B0SjfLZBf9mQlfO5rO"),
  drivePdf(4, "day-20", "Teil 4 · Tag 20", "1kiYoMoYzMbYhqVtcM6hSlv6v_iuQyhbm"),
  drivePdf(4, "day-21", "Teil 4 · Tag 21", "1UWNR8d2BnkxwgqfwMAq1hYv_vuWv5PD_"),
  drivePdf(4, "day-22", "Teil 4 · Tag 22", "131RdrNDeW9KdSSf_cvvFTdRHOq7wLhuZ"),
  drivePdf(
    4,
    "day-23-errors",
    "Teil 4 · Tag 23 · Finde die Fehler",
    "1PcwtlBQ9KIItMme6hAmRK4vwBzkAHYzR",
  ),
  drivePdf(4, "day-24", "Teil 4 · Tag 24", "1qGDxTmlNWcIaQBZHNv3sysbhcZ9UGTtb"),
  drivePdf(
    4,
    "day-25-text",
    "Teil 4 · Tag 25 · Textanalyse Crowdfunding",
    "1qfMYVieCn5n5JS0LXt7KRO97c3VBjBVv",
  ),
  drivePdf(
    4,
    "day-26-exercise",
    "Teil 4 · Tag 26 · Übung",
    "1SOOiihT87m0M4Q-A6LUVF5DMO_gabamp",
  ),
  drivePdf(4, "day-27", "Teil 4 · Tag 27", "1SMATdvkDtRbHHsmliqep7j-gEbGBy34n"),
  drivePdf(
    4,
    "day-28-examples",
    "Teil 4 · Tag 28 · Beispiele und Übung",
    "1C_Vh3RU4OVrGRp9EVGkeYsBHjhsVWP42",
  ),
  drivePdf(4, "day-29", "Teil 4 · Tag 29", "1f1htFfutQKWrsRzBpAzMVifunP-duVLw"),
  drivePdf(4, "day-30", "Teil 4 · Tag 30", "1Vcnf38GQH3q2D7WZHUsvIv799nhq3H_D"),
  driveArchive(4, "1RLINX7jKgAjpPclsIm6JKOqHu2RWzt-d"),
] as const;

export const grammarTrainingCatalog = [
  {
    id: "grammar-training-catalog-part-1",
    title: "Teil 1 · 30 Tage plus Bonustage 31–32",
    description: "30 Tagesdateien, zwei Bonustage und das Originalarchiv.",
    folderUrl: grammarTrainingParts[0].url,
    items: grammarPart1Materials,
  },
  {
    id: "grammar-training-catalog-part-2",
    title: "Teil 2 · 30 Tage plus Bonus- und Zusatzmaterial",
    description:
      "30 Tagesdateien, Zusatzmaterial zu Konjunktiv I/II, zwei Bonustage und das Originalarchiv.",
    folderUrl: grammarTrainingParts[1].url,
    items: grammarPart2Materials,
  },
  {
    id: "grammar-training-catalog-part-3",
    title: "Teil 3 · 30 Tage plus Fehlertraining",
    description:
      "30 Tagesdateien einschließlich Fehlertraining an Tag 21 und das Originalarchiv.",
    folderUrl: grammarTrainingParts[2].url,
    items: grammarPart3Materials,
  },
  {
    id: "grammar-training-catalog-part-4",
    title: "Teil 4 · Tests, Lösungen und Zusatzmaterial",
    description:
      "Alle Tages-, Test-, Lösungs-, Sprachbaustein-, Textanalyse- und Übungsdateien plus Originalarchiv.",
    folderUrl: grammarTrainingParts[3].url,
    items: grammarPart4Materials,
  },
] as const satisfies readonly GrammarTrainingPart[];

export const grammarTrainingMaterials = grammarTrainingCatalog.flatMap(
  (part) => part.items,
);

export const errorRepairMaterials = [
  {
    id: "marija-find-errors-b2",
    title: "B2 · Finde die Fehler",
    level: "B2",
    format: "PDF",
    url: "https://drive.google.com/file/d/1PAG6_iFv3g3p0t6JiPbN95pMhR-cTueN/view",
  },
  {
    id: "marija-crashkurs-fehlerfrei",
    title: "Crashkurs fehlerfrei · Bonusmaterial",
    level: "B1–C1",
    format: "PDF",
    url: "https://drive.google.com/file/d/1RYtQTyn4LIeGqvTJEbwAqm64XmrjY5rR/view",
  },
] as const satisfies readonly DriveMaterialItem[];
