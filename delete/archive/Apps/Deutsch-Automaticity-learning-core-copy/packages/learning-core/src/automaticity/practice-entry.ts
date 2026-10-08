import { mountPractice } from "./practice";
const root = document.getElementById("practice-root");
if (root)
  void mountPractice(
    root,
    document.documentElement.lang === "de" ? "de" : "en",
  ).catch((error: unknown) => {
    const message = document.createElement("p");
    message.setAttribute("role", "alert");
    message.textContent =
      error instanceof Error ? error.message : "Practice could not start.";
    const retry = document.createElement("button");
    retry.textContent =
      document.documentElement.lang === "de" ? "Erneut versuchen" : "Try again";
    retry.onclick = () => location.reload();
    root.replaceChildren(message, retry);
  });
