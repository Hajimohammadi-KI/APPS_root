# Einstellungen — central settings integration

The user-facing name, section names, service names, folder levels and integration URLs are editable inside the settings application.

## JavaScript SDK

```html
<script src="https://werkzeug-study-tools.education-hajimohamm.chatgpt.site/einstellungen.js"></script>
<div id="central-settings"></div>
<script>
  Einstellungen.mount({
    container: "#central-settings",
    minHeight: "850px"
  });

  Einstellungen.get({
    sections: ["profile", "planning", "accessibility", "ai"]
  }).then((settings) => {
    console.log(settings);
  });

  const unsubscribe = Einstellungen.subscribe((settings) => {
    console.log("Settings changed", settings);
  });
</script>
```

## Iframe only

```html
<iframe
  src="https://werkzeug-study-tools.education-hajimohamm.chatgpt.site/settings?embed=1"
  width="100%"
  height="850"
  allow="clipboard-write"
  style="border:0;border-radius:18px"
></iframe>
```

Before another origin can read settings, add it as a trusted application in the “Von anderen Programmen aufrufen” section and grant only the required sections.

## Google OAuth callback

For the server-side OAuth flow, the callback must be the exact callback of the deployed copy:

```text
https://your-domain.example/api/google/callback
```

Set the same value in `GOOGLE_REDIRECT_URI` and Google Cloud. The callback shown in the UI is editable, but changing the label alone does not modify Google Cloud.

## Secure provider storage

This application needs a D1 binding named `DB`. Provider credentials are encrypted with `PROVIDER_SECRETS_KEY_V1`; keys and tokens are never returned by the integration SDK or exported settings JSON.

## Local development

```bash
npm ci
npm run dev
```

