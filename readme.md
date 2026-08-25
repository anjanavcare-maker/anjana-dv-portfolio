# Anjana DV — WordPress Web Designer · Portfolio

Static website: dark-violet portfolio with real client screenshots, pricing,
planner tool, FAQ and WhatsApp lead capture.

## Pages
- `index.html` — home (hero, launch checklist, work, services, process, skills, trust, contact)
- `pricing.html` — pricing + FAQ
- `about.html` — about + skills
- `plan.html` — interactive website planner (28 categories, 3 templates, photos, WhatsApp)

## Hosting
This folder is deployed to **GitHub Pages** from the `main` branch root.

## Updating (normal path)
Changes are made in the agent workspace and pushed through the sync script:
```
powershell -File sync-up.ps1 -Message "what changed"
```

## Updating (manual, rare)
Edit files here on GitHub → commit to `main` → Pages redeploys automatically.
Notify the agent afterwards so it pulls the change (or run `sync-down.ps1`).

## Editing guide
- Copy/text: inside each HTML page.
- Colours & visual style: `assets/styles.css` (all design tokens at the top, `:root`).
- Interactions & planner: `assets/app.js`.
- Client screenshots: `assets/thumbs/*.jpg`.
- Planner theme inspiration: `assets/themes.js` + `assets/theme-thumbs/`.
- **WhatsApp number** (planner lead capture): search `WHATSAPP_NUMBER` in `assets/app.js`.
- **Contact email**: search `hello@anjanadv.com` in `assets/app.js` and the contact page.