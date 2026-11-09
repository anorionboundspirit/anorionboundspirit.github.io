# An Orionbound Spirit: setup guide

This is your website. You do the setup once (about 20 minutes). After that, you write posts from your phone or computer. You do not need Claude for it.

Everything here is free: GitHub (stores your site), GitHub Pages (shows it to the world), Sveltia Studio (your editing screen).

---

## Part 1. Put the site online

**1. Make a GitHub account**
Go to github.com and sign up. Use your an.orionbound.spirit Gmail. Suggested username: `anorionboundspirit`.

**2. Make a repository**
- Click the **+** at the top right, then **New repository**.
- Name it exactly: `YOUR-USERNAME.github.io` (for example `anorionboundspirit.github.io`).
- Choose **Public**. Click **Create repository**.

**3. Upload the files**
Use a computer for this one-time step.
- Unzip the zip I sent you.
- In your new repository click **uploading an existing file**.
- Open the unzipped folder and drag **everything inside it** into the page (not the folder itself).
- Click **Commit changes**.

The folder `.github` is hidden on some computers, so it may not upload. Check: in your repository you should see `.github/workflows/deploy.yml`. If it is missing:
- Click **Add file > Create new file**.
- In the name box type `.github/workflows/deploy.yml` (typing the slashes makes the folders).
- Open `DEPLOY-WORKFLOW-copy.txt` from the zip, copy everything, paste it in, and commit.

**4. Turn on the website**
- In the repository click **Settings > Pages**.
- Under **Source** choose **GitHub Actions**.
- Click the **Actions** tab. Wait 1 to 2 minutes until the run has a green tick.
- Your site is now at `https://YOUR-USERNAME.github.io`.

**If your username is not `anorionboundspirit`:** open `admin/config.yml` in the repository (pencil icon) and change these three lines to your username: `repo`, `site_url`, `display_url`.

---

## Part 2. Open your Studio (the editing screen)

1. Go to `https://YOUR-USERNAME.github.io/admin/`
2. It asks for a token (like a special password). To make one:
   - On GitHub: your picture > **Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token**.
   - Name: `Studio`. Expiry: choose the longest allowed.
   - **Repository access:** Only select repositories, then pick your site repository.
   - **Permissions > Repository permissions > Contents: Read and write.**
   - Generate, copy the token, paste it into Studio.
3. Keep the token private. Never share it. If it expires, make a new one the same way.

Tip: on your phone, open the Studio page and choose **Add to Home screen** so it is one tap away.

---

## Part 3. Write a post

In Studio: **Posts > New Post**.
- Title, date, and the kind (Thought, Photo, Moment, Dream Story).
- Add a photo and a short description of it.
- Write your words. Add a question for readers at the end. Questions bring many more replies.
- Turn on **Keep as a draft** if you are not ready. Drafts stay hidden.
- Click **Save/Publish**. The site updates in about 1 to 2 minutes.

Menu items such as Photos or Dream Stories stay hidden until you have a post of that kind.

## Change the site itself

**Site settings** in Studio lets you change: all text, logo and pictures, menu names and order, home page sections (drag to reorder, switch off, add your own text, photo and quote blocks), heading font, accent colour and page colour.

---

## Part 4. Optional extras (switch them on when ready)

These stay hidden until you fill them in, under **Site settings**.

**Comments from readers**
- *Private messages* (only you see them): make a free form at formspree.io and paste its address into Comments > form address.
- *Public comments* (everyone sees them, readers need a GitHub login, appear immediately): set up giscus at giscus.app and paste the four values it gives you. If you fill both, public comments are used.

**Email signup:** make a free account at buttondown.com and paste your form address into Email signup.

**Social links:** Instagram is filled in already, so please check it opens your page. Add YouTube and Facebook links.

**Site address:** paste `https://YOUR-USERNAME.github.io` so shared links show a nice preview.

**Home-screen icon:** a square PNG, 512 by 512 or larger. Changing it is a separate setting from the logo.

---

## Problems?

- **Site shows 404:** wait 2 minutes, then check Settings > Pages says GitHub Actions.
- **Actions tab shows a red cross:** open the run and read the message, or send me a screenshot.
- **Studio will not log in:** the token needs Contents: Read and write, and must be for this repository.
- **A change does not show:** wait 2 minutes, then refresh the page.

If you get stuck on any step, send me a screenshot and I will guide you.
