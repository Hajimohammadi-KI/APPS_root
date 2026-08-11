# Research PDF Studio — integration

## Iframe

```html
<iframe
  id="research-pdf-studio"
  src="https://research-pdf-studio.education-hajimohamm.chatgpt.site?embed=1"
  width="100%"
  height="900"
  allow="clipboard-write"
  style="border:0;border-radius:18px"
></iframe>
```

## Send text or a Google Drive link to the reader

```js
const frame = document.querySelector("#research-pdf-studio");

frame.contentWindow.postMessage({
  type: "research-pdf-studio:set-selection",
  payload: "The selected article excerpt"
}, "https://research-pdf-studio.education-hajimohamm.chatgpt.site");

frame.contentWindow.postMessage({
  type: "research-pdf-studio:open-drive-file",
  payload: "https://drive.google.com/file/d/FILE_ID/view"
}, "https://research-pdf-studio.education-hajimohamm.chatgpt.site");
```

## Receive selection and annotation events

```js
window.addEventListener("message", (event) => {
  if (event.origin !== "https://research-pdf-studio.education-hajimohamm.chatgpt.site") return;

  if (event.data?.type === "research-pdf-studio:selection") {
    console.log("Selected PDF text", event.data.payload);
  }

  if (event.data?.type === "research-pdf-studio:marks") {
    console.log("Current annotations", event.data.payload);
  }
});
```

Never use `"*"` as the target origin in a production host. API keys are not included in annotation JSON exports.

## Google Drive

- A public single-file link works without OAuth when the file is shared as “Anyone with the link”.
- Private files and folder listing use a Google OAuth Client ID and a popup token flow.
- Add your deployed origin, for example `https://your-domain.example`, as an Authorized JavaScript origin in Google Cloud.
- This popup flow does not use a callback URL.

## Local development

```bash
npm ci
npm run dev
```

