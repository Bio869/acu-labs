# DNS Setup — acu-labs.com on IONOS &rarr; GitHub Pages

Goal: point `acu-labs.com` and `www.acu-labs.com` at GitHub Pages, while
keeping IONOS email working.

---

## What to REMOVE

These currently point your domain at IONOS's default parking page. Delete them.

| Type | Host | Current Value | Why remove |
|------|------|---------------|------------|
| A    | @    | `74.208.236.149` | Points to IONOS default site — replace with GitHub |
| AAAA | @    | `2607:f1c0:100f:f000:0:0:0:200` | Same — IPv6 to IONOS default site |

> Optionally, also remove `CNAME _domainconnect &rarr; _domainconnect.ionos.com`
> (it's only used by IONOS's "Domain Connect" auto-config; not needed for
> manual DNS). Safe to leave.

---

## What to ADD

### Apex domain (acu-labs.com) &rarr; GitHub Pages

Add **four A records** for `@`:

| Type | Host | Value             |
|------|------|-------------------|
| A    | @    | `185.199.108.153` |
| A    | @    | `185.199.109.153` |
| A    | @    | `185.199.110.153` |
| A    | @    | `185.199.111.153` |

(Optional but recommended — add **four AAAA records** for `@` so IPv6 clients work too:)

| Type | Host | Value                    |
|------|------|--------------------------|
| AAAA | @    | `2606:50c0:8000::153`    |
| AAAA | @    | `2606:50c0:8001::153`    |
| AAAA | @    | `2606:50c0:8002::153`    |
| AAAA | @    | `2606:50c0:8003::153`    |

### www subdomain

Add **one CNAME** for `www`:

| Type  | Host | Value                |
|-------|------|----------------------|
| CNAME | www  | `bio869.github.io`   |

> Note: value is `bio869.github.io` (no `https://`, no path, no trailing dot
> required by IONOS — just the hostname).

---

## What to KEEP (do not touch)

These are your IONOS mail records. Removing them breaks email.

| Type  | Host                  | Value                              |
|-------|-----------------------|------------------------------------|
| MX    | @                     | `mx00.ionos.com`                   |
| MX    | @                     | `mx01.ionos.com`                   |
| TXT   | @                     | `v=spf1 include:_spf-us.ionos.com ~all` |
| CNAME | `_dmarc`              | `dmarc.ionos.com`                  |
| CNAME | `s1-ionos._domainkey` | `s1.dkim.ionos.com`                |
| CNAME | `s2-ionos._domainkey` | `s2.dkim.ionos.com`                |
| CNAME | `autodiscover`        | `adsredir.ionos.info`              |
| TXT   | `_dep_ws_mutex`       | (IONOS domain verification — keep) |

---

## After DNS is updated

1. Wait **5&ndash;60 minutes** for DNS to propagate (sometimes faster).
2. Verify with:
   ```bash
   nslookup acu-labs.com
   nslookup www.acu-labs.com
   ```
   `acu-labs.com` should resolve to the four `185.199.*.153` IPs.
3. In the GitHub repo: **Settings &rarr; Pages**
   - Source: **GitHub Actions**
   - Custom domain: `acu-labs.com`
   - Wait for the green check, then enable **Enforce HTTPS**
     (GitHub provisions a Let's Encrypt cert automatically; can take ~15 min).
4. Visit **https://acu-labs.com** &mdash; you should see the site.
   `https://www.acu-labs.com` should redirect to the apex.

---

## Email setup (info@acu-labs.com)

The site links to `info@acu-labs.com`. Since the MX records point to IONOS,
you'll need to **create that mailbox (or an alias / forward)** in your IONOS
Email control panel:

- **IONOS Customer Account &rarr; Email &rarr; Create email address**
- Or set up an **alias / forward** so `info@acu-labs.com` lands in your
  existing mailbox.

Until you do this, mail to `info@acu-labs.com` will bounce.
