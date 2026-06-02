# ACU Labs — Marketing Website

Static, single-page marketing site for **acu-labs.com**. No build step.

## Local preview

Just open `index.html` in a browser, or:

```bash
# from repo root
npx serve website
```

## Deployment

Deploys automatically to GitHub Pages via `.github/workflows/deploy-website.yml`
on any push to `main` that touches `website/**`.

- Live URL (default): `https://bio869.github.io/acu-labs/`
- Custom domain: `acu-labs.com` (configured via `CNAME` file in this folder)

## First-time setup on GitHub

1. Repo &rarr; **Settings** &rarr; **Pages**
2. **Source**: *GitHub Actions*
3. After the first workflow run, set **Custom domain** to `acu-labs.com`
4. Wait for DNS check &rarr; enable **Enforce HTTPS**

## DNS at IONOS

See `../DNS-SETUP.md` for the exact records to add/remove.
