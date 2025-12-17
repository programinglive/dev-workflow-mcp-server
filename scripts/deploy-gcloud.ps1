# GCP Deployment Script using gcloud CLI (PowerShell)
# This script deploys the dev-workflow MCP server to a GCP Compute Engine instance

$ErrorActionPreference = "Stop"

# Configuration - Update these values
$PROJECT_ID = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "edmee-project" }
$INSTANCE_NAME = if ($env:GCP_INSTANCE_NAME) { $env:GCP_INSTANCE_NAME } else { "docker-almi" }
$ZONE = if ($env:GCP_ZONE) { $env:GCP_ZONE } else { "asia-southeast2-a" }
$INSTANCE_USER = if ($env:GCP_INSTANCE_USER) { $env:GCP_INSTANCE_USER } else { "dhika" }

Write-Host "🚀 Deploying dev-workflow MCP server to GCP..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID"
Write-Host "Instance: $INSTANCE_NAME"
Write-Host "Zone: $ZONE"
Write-Host ""

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Set the project
Write-Host "📋 Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Get instance external IP
Write-Host "🔍 Getting instance external IP..." -ForegroundColor Yellow
$EXTERNAL_IP = gcloud compute instances describe $INSTANCE_NAME `
    --zone=$ZONE `
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"

if ([string]::IsNullOrEmpty($EXTERNAL_IP)) {
    Write-Host "❌ Could not get instance external IP" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Instance IP: $EXTERNAL_IP" -ForegroundColor Green
Write-Host ""

# Test SSH connection
Write-Host "🔐 Testing SSH connection..." -ForegroundColor Yellow
try {
    $testResult = gcloud compute ssh "$INSTANCE_USER@$INSTANCE_NAME" `
        --zone=$ZONE `
        --command="echo 'Connection successful'" 2>&1
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to instance via SSH" -ForegroundColor Red
    Write-Host "Please ensure:"
    Write-Host "  1. SSH keys are configured in GCP"
    Write-Host "  2. Firewall allows SSH (port 22)"
    Write-Host "  3. Instance is running"
    exit 1
}
Write-Host ""

# Copy files to instance
Write-Host "📦 Copying project files to instance..." -ForegroundColor Yellow
gcloud compute scp --recurse `
    --zone=$ZONE `
    . "$INSTANCE_USER@${INSTANCE_NAME}:~/dev-workflow-mcp-server/" `
    --exclude=".git" `
    --exclude="node_modules" `
    --exclude=".state" `
    --exclude="dist"

Write-Host "✅ Files copied successfully" -ForegroundColor Green
Write-Host ""

# Create deployment script for remote execution
$deployScript = @'
set -e

cd ~/dev-workflow-mcp-server

echo "📥 Installing Docker if not present..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

echo "📥 Installing Docker Compose if not present..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

echo "⚙️  Configuring environment..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "⚠️  Created .env file from template"
    echo "⚠️  Please update the passwords in .env before production use!"
fi

echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 15

echo "📊 Checking container status..."
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Container logs:"
docker-compose logs --tail=20
'@

# Run deployment commands on the instance
Write-Host "🚀 Running deployment on instance..." -ForegroundColor Yellow
$deployScript | gcloud compute ssh "$INSTANCE_USER@$INSTANCE_NAME" `
    --zone=$ZONE `
    --command="bash -s"

Write-Host ""
Write-Host "🎉 Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into instance and update .env with secure passwords:"
Write-Host "   gcloud compute ssh $INSTANCE_USER@$INSTANCE_NAME --zone=$ZONE"
Write-Host "   cd ~/dev-workflow-mcp-server"
Write-Host "   nano .env"
Write-Host ""
Write-Host "2. Update your local MCP client config:" -ForegroundColor Cyan
Write-Host @"
   {
     "mcpServers": {
       "dev-workflow": {
         "command": "gcloud",
         "args": [
           "compute", "ssh", "$INSTANCE_USER@$INSTANCE_NAME",
           "--zone=$ZONE",
           "--command=docker exec -i dev-workflow-mcp node /app/index.js"
         ]
       }
     }
   }
"@
Write-Host ""
Write-Host "3. Test the connection:" -ForegroundColor Cyan
Write-Host "   gcloud compute ssh $INSTANCE_USER@$INSTANCE_NAME --zone=$ZONE --command='docker exec -i dev-workflow-mcp node /app/index.js call get_workflow_status'"
