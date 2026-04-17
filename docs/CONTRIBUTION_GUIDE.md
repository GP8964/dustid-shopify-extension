# Dustid Lite – Getting Started Guide

This guide walks you through cloning the repo and getting the Dustid Lite Shopify extension running locally on your machine.

---

## Prerequisites

Make sure you have the following installed before you begin:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **Shopify CLI** — install it by running:

```bash
npm install -g @shopify/cli@latest
```

You will also need:

- A **Shopify Partner account** — [partners.shopify.com](https://partners.shopify.com)
- A **Shopify Development Store** created from your Partner dashboard
- Access to the **Dustid Shopify app** on the Partner account (contact the team if you don't have access)

---

## Cloning the Repo

```bash
git clone https://github.com/devMuhammad05/dustid-shopify-extension.git 
cd dustid-shopify-extension
```

---

## Installing Dependencies

```bash
npm install
```

---

## Folder Structure

```
dustid-lite/
  extensions/
    dustid-widget/              ← Theme App Extension
      blocks/
        dustid_widget.liquid    ← Block template (Shopify's templating language)
      assets/
        widget.js               ← Widget logic and UI
        widget.css              ← Widget styles
      shopify.extension.toml    ← Extension config
  shopify.app.toml              ← App config
  package.json
```

---

## Running the App Locally

Start the local development server:

```bash
shopify app dev
```

The CLI will prompt you to:

1. **Log in** to your Shopify Partner account (opens a browser window)
2. **Select your development store** to preview the app on
3. **Install the app** on that store if it hasn't been installed yet

Once running you will see something like:

```
✅ Ready, watching for changes in your app

Preview URL: https://admin.shopify.com/store/your-store/apps/...
```

Keep this terminal running at all times while developing.

---

## Adding the Widget to Your Store

After the dev server is running:

1. Go to your Shopify Admin → **Online Store** → **Themes** → **Customize**
2. In the theme editor, click on any **Section** in the left sidebar
3. Click **Add block** → switch to the **Apps** tab
4. Select **Dustid Gift Selector**
5. Click **Save**

The banner should now appear on your storefront.

---

## Making Changes

| File | What it controls |
|---|---|
| `blocks/dustid_widget.liquid` | HTML mount point and schema settings |
| `assets/widget.js` | Widget UI, states, and logic |
| `assets/widget.css` | All banner styles |
| `shopify.extension.toml` | Extension name and configuration |

The dev server watches for file changes automatically — just save a file and refresh the storefront to see updates.


## Useful Commands

```bash
# Start local dev server
shopify app dev

# Generate a new extension
shopify app generate extension

# Check app and extension info
shopify app info

# Clear CLI cache if you run into issues
shopify cache clear
```

---

## Questions

For questions about the codebase reach out to the team or open an issue on the repo.
