#!/bin/bash
# GCP Deployment Script using gcloud CLI
# This script deploys the dev-workflow MCP server to a GCP Compute Engine instance

set -e

# Configuration - Update these values
PROJECT_ID="${GCP_PROJECT_ID:-edmee-project}"
INSTANCE_NAME="${GCP_INSTANCE_NAME:-docker-almi}"
ZONE="${GCP_ZONE:-asia-southeast2-a}"
INSTANCE_USER="${GCP_INSTANCE_USER:-dhika}"

echo "🚀 Deploying dev-workflow MCP server to GCP..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Zone: $ZONE"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Get instance external IP
echo "🔍 Getting instance external IP..."
EXTERNAL_IP=$(gcloud compute instances describe "$INSTANCE_NAME" \
    --zone="$ZONE" \
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

if [ -z "$EXTERNAL_IP" ]; then
    echo "❌ Could not get instance external IP"
    exit 1
fi

echo "✅ Instance IP: $EXTERNAL_IP"
echo ""

# Test SSH connection
echo "🔐 Testing SSH connection..."
if ! gcloud compute ssh "$INSTANCE_USER@$INSTANCE_NAME" \
    --zone="$ZONE" \
    --command="echo 'Connection successful'" &> /dev/null; then
    echo "❌ Cannot connect to instance via SSH"
    echo "Please ensure:"
    echo "  1. SSH keys are configured in GCP"
    echo "  2. Firewall allows SSH (port 22)"
    echo "  3. Instance is running"
    exit 1
fi
echo "✅ SSH connection successful"
echo ""

# Copy files to instance
echo "📦 Copying project files to instance..."
gcloud compute scp --recurse \
    --zone="$ZONE" \
    . "$INSTANCE_USER@$INSTANCE_NAME:~/dev-workflow-mcp-server/" \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".state" \
    --exclude="dist"

echo "✅ Files copied successfully"
echo ""

# Run deployment commands on the instance
echo "🚀 Running deployment on instance..."
gcloud compute ssh "$INSTANCE_USER@$INSTANCE_NAME" \
    --zone="$ZONE" \
    --command="bash -s" << 'ENDSSH'
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
ENDSSH

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📝 Next steps:"
echo "1. SSH into instance and update .env with secure passwords:"
echo "   gcloud compute ssh $INSTANCE_USER@$INSTANCE_NAME --zone=$ZONE"
echo "   cd ~/dev-workflow-mcp-server"
echo "   nano .env"
echo ""
echo "2. Update your local MCP client config:"
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"dev-workflow\": {"
echo "         \"command\": \"gcloud\","
echo "         \"args\": ["
echo "           \"compute\", \"ssh\", \"$INSTANCE_USER@$INSTANCE_NAME\","
echo "           \"--zone=$ZONE\","
echo "           \"--command=docker exec -i dev-workflow-mcp node /app/index.js\""
echo "         ]"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "3. Test the connection:"
echo "   gcloud compute ssh $INSTANCE_USER@$INSTANCE_NAME --zone=$ZONE --command='docker exec -i dev-workflow-mcp node /app/index.js call get_workflow_status'"
