# Minus Style Dashboard Deploy Guide

## Step 1: Publish the app

### Netlify Drop
1. Go to `https://app.netlify.com/drop`.
2. Drag this whole folder into the upload area:
   `Affiliate with MS`
3. Netlify will give you a public link.
4. Open that link from mobile or another PC.

### GitHub Pages
1. Create a new GitHub repository.
2. Upload `index.html`, `app.js`, `styles.css`, `netlify.toml`, and `google-apps-script/Code.gs`.
3. Go to repository `Settings > Pages`.
4. Set source to the main branch root.
5. Open the generated GitHub Pages URL.

## Step 2: Create Google Sheets backend

1. Create a new Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Delete the default code.
4. Paste the content from `google-apps-script/Code.gs`.
5. Save the Apps Script project.
6. Click `Deploy > New deployment`.
7. Select type: `Web app`.
8. Execute as: `Me`.
9. Who has access: `Anyone`.
10. Deploy and copy the Web App URL.

## Step 3: Connect the dashboard to Google Sheets

1. Open the published dashboard.
2. Login as Admin.
3. Go to `Admin Settings`.
4. Paste the Apps Script Web App URL into `Google Sheets Backend`.
5. Click `URL সেভ`.
6. Click `Cloud-এ পাঠান` once to upload current dashboard data.
7. From any mobile/PC, open the dashboard link and use `Cloud থেকে আনুন` if needed.

## Important

- Without the Google Sheets backend, each browser keeps separate local data.
- With backend URL saved, the app reads/writes the shared Google Sheet state.
- WhatsApp notifications are currently queued with one-click WhatsApp links. Fully automatic sending needs WhatsApp Business API or Twilio.
