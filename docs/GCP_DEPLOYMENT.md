# Deploying to Google Cloud Platform with Docker

This guide walks you through deploying the dev-workflow MCP server to Google Cloud Compute Engine using Docker and PostgreSQL.

## Prerequisites

- Google Cloud Platform account with a Compute Engine instance running
- SSH access to your GCP instance
- Git installed locally and on GCP instance
- Basic familiarity with Docker and SSH

## Architecture Overview

The deployment consists of two Docker containers:
- **MCP Server**: Node.js application running the dev-workflow MCP server
- **PostgreSQL**: Database for persistent workflow state storage

Communication between your local MCP client and the cloud server happens via SSH tunneling.

## Step 1: Prepare Your GCP Instance

### 1.1 SSH into Your Instance

```bash
ssh your-username@YOUR_GCP_IP
```

### 1.2 Run the Setup Script

From your local machine, copy the setup script to your GCP instance:

```bash
scp scripts/setup-gcp-instance.sh your-username@YOUR_GCP_IP:~/
ssh your-username@YOUR_GCP_IP 'bash ~/setup-gcp-instance.sh'
```

This script will:
- Install Docker and Docker Compose
- Install Git
- Create the application directory

**Note**: You may need to log out and back in for Docker group permissions to take effect.

## Step 2: Deploy the Application

### 2.1 Clone the Repository

On your GCP instance:

```bash
cd ~/dev-workflow-mcp-server
git clone https://github.com/programinglive/dev-workflow-mcp-server.git .
```

### 2.2 Configure Environment Variables

Create a `.env` file from the production template:

```bash
cp .env.production .env
nano .env
```

Update the following values:
- `POSTGRES_PASSWORD`: Set a strong, unique password
- `DEV_WORKFLOW_DB_URL`: Update with the same password
- `DEV_WORKFLOW_USER_ID`: (Optional) Set your username

Example `.env`:
```bash
DEV_WORKFLOW_DB_TYPE=postgres
DEV_WORKFLOW_DB_URL=postgres://devworkflow:MySecureP@ssw0rd@postgres:5432/devworkflow
POSTGRES_PASSWORD=MySecureP@ssw0rd
DEV_WORKFLOW_USER_ID=dhika
NODE_ENV=production
```

### 2.3 Start the Containers

```bash
docker-compose up -d
```

### 2.4 Verify Deployment

Check that both containers are running:

```bash
docker-compose ps
```

You should see:
```
NAME                      STATUS
dev-workflow-mcp          Up
dev-workflow-postgres     Up (healthy)
```

View logs:
```bash
docker-compose logs -f mcp-server
```

## Step 3: Configure Local MCP Client

Update your local MCP client configuration to connect via SSH.

### Windows (Claude Desktop)

Edit `C:\Users\DHIKA\.gemini\antigravity\mcp_config.json`:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "ssh",
      "args": [
        "-i", "C:\\Users\\DHIKA\\.ssh\\id_rsa",
        "your-username@34.50.121.142",
        "docker", "exec", "-i", "dev-workflow-mcp", "node", "/app/index.js"
      ]
    }
  }
}
```

### Linux/Mac

Edit your MCP config file:

```json
{
  "mcpServers": {
    "dev-workflow": {
      "command": "ssh",
      "args": [
        "-i", "/home/user/.ssh/id_rsa",
        "your-username@34.50.121.142",
        "docker", "exec", "-i", "dev-workflow-mcp", "node", "/app/index.js"
      ]
    }
  }
}
```

**Important**: Replace:
- `your-username` with your actual GCP username
- `34.50.121.142` with your actual GCP external IP
- SSH key path with your actual key location

## Step 4: Test the Connection

### 4.1 Test SSH Connection

From your local machine:

```bash
ssh your-username@34.50.121.142 'docker exec -i dev-workflow-mcp node /app/index.js call get_workflow_status'
```

You should see the workflow status output.

### 4.2 Test via MCP Client

Restart your MCP client (e.g., Claude Desktop) and try using a dev-workflow command like `start_task`.

## Updating the Deployment

### Automated Deployment

Use the deployment script from your local machine:

```bash
# Set environment variables
export GCP_USER=your-username
export GCP_HOST=34.50.121.142
export GCP_SSH_KEY=~/.ssh/id_rsa

# Run deployment
bash scripts/deploy-gcp.sh
```

### Manual Update

On your GCP instance:

```bash
cd ~/dev-workflow-mcp-server
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Database Management

### Backup Database

```bash
docker exec dev-workflow-postgres pg_dump -U devworkflow devworkflow > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i dev-workflow-postgres psql -U devworkflow devworkflow
```

### Access PostgreSQL Console

```bash
docker exec -it dev-workflow-postgres psql -U devworkflow devworkflow
```

Common commands:
- `\dt` - List tables
- `\d table_name` - Describe table
- `SELECT * FROM workflow_state;` - View workflow data

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs mcp-server
docker-compose logs postgres
```

### Database Connection Issues

Verify PostgreSQL is healthy:
```bash
docker-compose ps
docker exec dev-workflow-postgres pg_isready -U devworkflow
```

### SSH Connection Fails

Test basic SSH:
```bash
ssh -v your-username@YOUR_GCP_IP
```

Check SSH key permissions:
```bash
chmod 600 ~/.ssh/id_rsa
```

### MCP Client Can't Connect

1. Verify SSH works: `ssh your-username@YOUR_GCP_IP 'echo test'`
2. Test Docker exec: `ssh your-username@YOUR_GCP_IP 'docker ps'`
3. Check MCP server: `ssh your-username@YOUR_GCP_IP 'docker logs dev-workflow-mcp'`

## Security Best Practices

1. **Change Default Passwords**: Always use strong, unique passwords in `.env`
2. **Firewall Configuration**: Only expose necessary ports (SSH port 22)
3. **SSH Key Authentication**: Disable password authentication, use SSH keys only
4. **Regular Updates**: Keep Docker images and system packages updated
5. **Backup Regularly**: Schedule automated database backups

## Performance Optimization

### Monitor Resource Usage

```bash
docker stats
```

### Increase PostgreSQL Performance

Edit `docker-compose.yml` to add PostgreSQL tuning:

```yaml
postgres:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
```

## Uninstalling

To completely remove the deployment:

```bash
cd ~/dev-workflow-mcp-server
docker-compose down -v  # -v removes volumes (deletes data!)
cd ~
rm -rf dev-workflow-mcp-server
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/programinglive/dev-workflow-mcp-server/issues
- Documentation: https://devworkflow.programinglive.com/
