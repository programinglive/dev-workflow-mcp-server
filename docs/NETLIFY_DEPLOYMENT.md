# Netlify Deployment Guide

Deploy the Dev Workflow web dashboard to Netlify for a public-facing documentation and demo site.

## Overview

The web dashboard can be deployed to Netlify as a static Next.js application. This deployment mode provides:

- **Static documentation pages** - Full access to the `/docs` section
- **Demo interface** - Showcase the workflow features
- **API endpoints** - Serverless functions for version and npm download stats

> **Note:** Database features (history, summary) return placeholder data in this deployment mode. For full functionality with persistent data, use the [local development server](./web-dashboard.md) or [Plesk deployment](./PLESK_DEPLOYMENT.md).

## Live Site

The official deployment is available at:
- **Primary:** https://devworkflow.programinglive.com
- **Netlify:** https://devworkflow.netlify.app

## Prerequisites

- Netlify account (free tier works)
- Node.js 18+ for local builds
- Git repository connected to Netlify (optional, for auto-deploy)

## Quick Deploy

### Option 1: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to web directory
cd web

# Create new site and deploy
netlify sites:create --name your-site-name
netlify deploy --prod --build
```

### Option 2: Netlify Dashboard

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory:** `web`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Deploy

## Configuration

The `web/netlify.toml` file configures the build:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

## Custom Domain Setup

1. Go to your site's **Domain management** in Netlify
2. Click **Add a domain**
3. Enter your subdomain (e.g., `devworkflow.yourdomain.com`)
4. Add a CNAME record in your DNS provider:
   - **Host:** `devworkflow` (or your subdomain)
   - **Value:** `your-site-name.netlify.app`
5. Click **Provision certificate** for HTTPS

## API Endpoints

The following API routes are available as Netlify Functions:

| Endpoint | Description |
| --- | --- |
| `/api/version` | Returns current package version |
| `/api/npm-downloads` | Returns monthly npm download count |
| `/api/summary` | Returns placeholder summary data |
| `/api/history` | Returns placeholder history data |
| `/api/docs` | Returns documentation content |

## Limitations

When deployed to Netlify (static mode):

- **No persistent database** - History and summary return empty/placeholder data
- **No real-time updates** - Data is static between deployments
- **Version is build-time** - Update `web/app/api/version/route.ts` before each release

## Updating the Deployment

### Manual Redeploy

```bash
cd web
netlify deploy --prod --build
```

### Auto-Deploy (Recommended)

Connect your GitHub repository to Netlify for automatic deployments on push to main branch.

## Troubleshooting

| Issue | Solution |
| --- | --- |
| 404 on custom domain | Provision SSL certificate in Netlify dashboard |
| Build fails | Ensure `web/package.json` has no native dependencies |
| Functions timeout | Netlify has 10s limit; optimize API routes |

## Related

- [Web Dashboard Guide](./web-dashboard.md)
- [Plesk Deployment](./PLESK_DEPLOYMENT.md)
- [Main README](../README.md)
