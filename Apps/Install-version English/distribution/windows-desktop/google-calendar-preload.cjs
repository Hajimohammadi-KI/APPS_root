function registerCalendarPreload(options) {
  const {
    ipcRenderer,
    productId = "",
    productName = "",
    storageKey = "",
    locale = "en",
  } = options ?? {};

  if (!ipcRenderer || typeof ipcRenderer.invoke !== "function") return;

  const calendarBridge = Object.freeze({
    status: () => ipcRenderer.invoke("desktop:calendar:status"),
    connect: () => ipcRenderer.invoke("desktop:calendar:connect"),
    sync: (events) => ipcRenderer.invoke("desktop:calendar:sync", events),
    disconnect: () => ipcRenderer.invoke("desktop:calendar:disconnect"),
  });

  const metadata = Object.freeze({ productId, productName, storageKey, locale });
  try {
    const { contextBridge } = require("electron");
    if (contextBridge && typeof contextBridge.exposeInMainWorld === "function") {
      contextBridge.exposeInMainWorld("googleCalendar", calendarBridge);
      contextBridge.exposeInMainWorld("studyCalendarMeta", metadata);
    }
  } catch {
    // Ignore non-Electron test environments.
  }
}

module.exports = { registerCalendarPreload };
