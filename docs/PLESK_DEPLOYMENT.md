# Deploying dev-workflow-mcp-server to Plesk

This guide covers deploying the dev-workflow MCP server (Node.js backend + Next.js frontend) to Plesk hosting.

## Prerequisites

- Plesk control panel access
- Node.js 18+ installed on the server
- Git installed on the server
- Domain/subdomain configured in Plesk

## Deployment Steps

### 1. Set Up Node.js Application in Plesk

1. Log in to Plesk control panel
2. Go to **Domains** → Select your domain
3. Click **Node.js** (or **Applications** if using newer Plesk)
4. Click **Add Application**
5. Configure:
   - **Application root**: `/var/www/vhosts/yourdomain.com/dev-workflow-mcp-server` (or your path)
   - **Startup file**: `index.js`
   - **Node.js version**: 18.x or higher
   - **Port**: Leave as auto (Plesk assigns a port)

### 2. Clone Repository

SSH into your Plesk server:

```bash
cd /var/www/vhosts/yourdomain.com
git clone https://github.com/programinglive/dev-workflow-mcp-server.git
cd dev-workflow-mcp-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build the Application

```bash
npm run build
```

This builds:
- **Backend**: Vite bundle → `dist/index.mjs`
- **Frontend**: Next.js static + server → `web/.next/`
- **Docs**: HTML files → `dist/docs/`

### 5. Configure Environment (if needed)

Create `.env` file in the project root if you need custom settings:

```bash
# Example (adjust as needed)
NODE_ENV=production
PORT=3000
```

### 6. Start the Application

In Plesk:
1. Go back to **Node.js Applications**
2. Find your application
3. Click **Start** (or it may auto-start)

Alternatively, via SSH:

```bash
npm start
```

### 7. Configure Reverse Proxy (Plesk)

Plesk automatically sets up a reverse proxy. Verify:
1. Go to **Domains** → Your domain → **Web Server Settings**
2. Ensure **Proxy** is enabled
3. Verify the proxy points to the Node.js app port

### 8. Verify Deployment

- Visit `https://yourdomain.com` → Should see the Next.js frontend
- Visit `https://yourdomain.com/docs` → Should see documentation
- Check browser console for any `_next/static` 500 errors

If you see 500 errors on `_next/static` requests:
- SSH to server and check logs: `tail -f /var/log/plesk/nodejs/yourdomain.com.log`
- Ensure `.next` directory exists: `ls -la web/.next/`
- Verify Node.js is running: `ps aux | grep node`

### 9. Set Up Auto-Restart (Optional)

In Plesk, the Node.js app should auto-restart on failure. To verify:
1. Go to **Node.js Applications**
2. Check **Restart policy** is set to auto-restart

### 10. Enable HTTPS (Recommended)

1. Go to **Domains** → Your domain → **SSL/TLS Certificates**
2. Click **Install** (use Let's Encrypt free certificate)
3. Plesk auto-redirects HTTP → HTTPS

## Troubleshooting

### `_next/static` returns 500

**Cause**: Next.js build output not deployed or server crashed.

**Fix**:
```bash
# SSH to server
npm run build --prefix web
npm start
# Check logs
tail -f /var/log/plesk/nodejs/yourdomain.com.log
```

### Application won't start

**Check**:
1. Node.js version: `node --version` (must be 18+)
2. Dependencies: `npm install`
3. Build output: `ls -la dist/` and `ls -la web/.next/`
4. Logs: Check Plesk control panel logs

### Port conflicts

Plesk assigns ports automatically. If you get a port conflict:
1. Go to **Node.js Applications** → Edit
2. Let Plesk auto-assign a new port
3. Restart the app

## Updating the Application

To deploy a new version:

```bash
cd /var/www/vhosts/yourdomain.com/dev-workflow-mcp-server
git pull origin main
npm install
npm run build
# Plesk will auto-restart the app
```

Or manually restart in Plesk control panel:
1. **Node.js Applications** → Select app → **Restart**

## Production Checklist

- [ ] Node.js 18+ installed
- [ ] `npm install` completed
- [ ] `npm run build` succeeded (no errors)
- [ ] `.next` directory exists with static files
- [ ] HTTPS/SSL certificate installed
- [ ] Reverse proxy configured
- [ ] Application started and running
- [ ] `https://yourdomain.com` loads without 500 errors
- [ ] `_next/static` assets load correctly
- [ ] Logs show no errors

## Support

For issues:
1. Check Plesk logs: `/var/log/plesk/nodejs/`
2. SSH and run `npm start` manually to see real-time errors
3. Verify Node.js and npm versions
4. Ensure all dependencies installed: `npm install`
