# Self-Hosted GitHub Actions Runners Configuration

## Overview

All CI/CD workflows in this repository support both **GitHub-hosted runners** and **self-hosted runners**. By default, workflows use GitHub-hosted runners (`ubuntu-latest`), but you can easily switch to self-hosted runners using repository variables.

**Default Behavior:**
- ✅ Uses GitHub-hosted runners (`ubuntu-latest`) by default
- ✅ Can switch to self-hosted runners via `RUNNER_TYPE` repository variable
- ✅ Supports custom labels for specialized self-hosted runners

---

## 🎯 Benefits of Self-Hosted Runners

- **Cost Savings**: Unlimited build minutes on your own infrastructure
- **Performance**: Faster builds with more powerful hardware
- **Caching**: Persistent caching between builds
- **Custom Software**: Pre-installed tools and dependencies
- **Security**: Keep builds within your private network
- **Compliance**: Meet regulatory requirements for data residency

---

## 🚀 Quick Setup

### Step 1: Configure Repository Variable

Set the `RUNNER_TYPE` repository variable to specify which runner type to use:

#### Option A: Use GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions** → **Variables** tab
3. Click **New repository variable**
4. Name: `RUNNER_TYPE`
5. Value: Choose one:
   - `ubuntu-latest` (GitHub-hosted, default - no variable needed)
   - `self-hosted` (your own runners)
   - `[self-hosted, linux, x64]` (specific labels)
   - Custom labels like `[self-hosted, gpu]` for specialized runners

#### Option B: Use GitHub CLI

```bash
# Switch to self-hosted runners
gh variable set RUNNER_TYPE --body "self-hosted"

# Switch back to GitHub-hosted (or delete variable for default)
gh variable set RUNNER_TYPE --body "ubuntu-latest"

# Set with specific labels
gh variable set RUNNER_TYPE --body "[self-hosted, linux, x64]"

# Remove variable (reverts to default 'ubuntu-latest')
gh variable delete RUNNER_TYPE
```

### Step 2: Set Up Self-Hosted Runner (Optional)

#### On Linux (Ubuntu/Debian)

```bash
# Create a directory for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/NoelKhan/Medibot-MBSE --token YOUR_TOKEN

# Start the runner
./run.sh

# Optional: Install as a service
sudo ./svc.sh install
sudo ./svc.sh start
```

#### On macOS

```bash
# Create a directory for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-osx-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-osx-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/NoelKhan/Medibot-MBSE --token YOUR_TOKEN

# Start the runner
./run.sh

# Optional: Install as a service
./svc.sh install
./svc.sh start
```

#### On Windows (PowerShell)

```powershell
# Create a directory for the runner
mkdir actions-runner; cd actions-runner

# Download the latest runner package
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip

# Extract the installer
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.311.0.zip", "$PWD")

# Configure the runner
./config.cmd --url https://github.com/NoelKhan/Medibot-MBSE --token YOUR_TOKEN

# Start the runner
./run.cmd

# Optional: Install as a service
./svc.cmd install
./svc.cmd start
```

#### Get Registration Token

Visit: `https://github.com/NoelKhan/Medibot-MBSE/settings/actions/runners/new`

---

## 🐳 Docker-Based Self-Hosted Runner

### Quick Start with Docker

```bash
# Pull the official runner image
docker pull myoung34/github-runner:latest

# Run the container
docker run -d \
  --name github-runner \
  --restart always \
  -e RUNNER_NAME="docker-runner" \
  -e RUNNER_WORK_DIRECTORY="/tmp/runner" \
  -e RUNNER_SCOPE="repo" \
  -e REPO_URL="https://github.com/NoelKhan/Medibot-MBSE" \
  -e ACCESS_TOKEN="YOUR_GITHUB_PAT" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  myoung34/github-runner:latest
```

### Docker Compose Setup

Create `docker-compose.runner.yml`:

```yaml
version: '3.8'

services:
  github-runner:
    image: myoung34/github-runner:latest
    container_name: github-runner
    restart: unless-stopped
    environment:
      RUNNER_NAME: docker-runner-01
      RUNNER_WORK_DIRECTORY: /tmp/runner
      RUNNER_SCOPE: repo
      REPO_URL: https://github.com/NoelKhan/Medibot-MBSE
      ACCESS_TOKEN: ${GITHUB_PAT}
      LABELS: self-hosted,docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-work:/tmp/runner

volumes:
  runner-work:
```

Start the runner:

```bash
# Set your GitHub Personal Access Token
export GITHUB_PAT=ghp_your_token_here

# Start the runner
docker-compose -f docker-compose.runner.yml up -d

# View logs
docker-compose -f docker-compose.runner.yml logs -f

# Stop the runner
docker-compose -f docker-compose.runner.yml down
```

---

## 🏷️ Using Custom Labels

You can add custom labels to your self-hosted runners for specialized jobs:

### Configure Runner with Labels

```bash
# During setup, add labels
./config.sh --url https://github.com/NoelKhan/Medibot-MBSE \
  --token YOUR_TOKEN \
  --labels self-hosted,linux,x64,gpu,high-memory
```

### Use Labels in Workflows

Set the `RUNNER_TYPE` variable to match your labels:

```bash
# For GPU runner
gh variable set RUNNER_TYPE --body "[self-hosted, gpu]"

# For high-memory runner
gh variable set RUNNER_TYPE --body "[self-hosted, high-memory]"

# Multiple labels
gh variable set RUNNER_TYPE --body "[self-hosted, linux, x64, gpu]"
```

---

## 📋 Prerequisites for Self-Hosted Runners

### Required Software

#### For Backend Workflows
- Node.js 18.x or later
- npm or yarn
- Docker (for building images)
- PostgreSQL client (for tests)
- Redis client (for tests)

#### For AI Agent Workflows
- Python 3.9 or later
- pip
- Docker

#### For Web Workflows
- Node.js 20.x or later
- npm
- Docker

#### For Mobile Workflows
- Node.js 20.x or later
- Expo CLI
- React Native dependencies

### Installation Script

```bash
#!/bin/bash
# setup-runner-dependencies.sh

# Update system
sudo apt-get update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Python
sudo apt-get install -y python3.11 python3-pip

# Install PostgreSQL client
sudo apt-get install -y postgresql-client

# Install Redis client
sudo apt-get install -y redis-tools

# Verify installations
node --version
npm --version
docker --version
python3 --version
pip3 --version
psql --version
redis-cli --version
```

---

## 🔐 Security Best Practices

### 1. Runner Isolation

- Run each runner in a separate VM or container
- Use ephemeral runners that are destroyed after each job
- Never run multiple jobs on the same runner simultaneously

### 2. Network Security

```bash
# Configure firewall
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Restrict runner to specific IPs
sudo ufw allow from GITHUB_IP_RANGE
```

### 3. Use Personal Access Tokens (PAT)

Create a PAT with minimal permissions:
- Required scopes: `repo`, `workflow`
- Set expiration date
- Rotate regularly

### 4. Secrets Management

```bash
# Store secrets in environment variables
export GITHUB_PAT=$(cat ~/.github-pat)

# Use Docker secrets
docker secret create github_pat ~/.github-pat
```

### 5. Monitor Runner Activity

```bash
# View runner logs
tail -f /path/to/runner/_diag/Runner_*.log

# Check runner status
./run.sh --check

# View connected runners in GitHub UI
# Settings → Actions → Runners
```

---

## 🔄 Switching Between Runner Types

### Using Self-Hosted Runner (Default)

```bash
# Self-hosted is the default - no configuration needed
# Just set up your runner and it will be used automatically

# Push a change to trigger workflow
git commit --allow-empty -m "Test self-hosted runner"
git push

# Watch the workflow
gh run watch
```

### Switch to GitHub-Hosted Runner

```bash
# Force use of GitHub-hosted runners
gh variable set RUNNER_TYPE --body "ubuntu-latest"

# Push a change to trigger workflow
git commit --allow-empty -m "Test GitHub-hosted runner"
git push

# Watch the workflow
gh run watch
```

### Revert to Default (Self-Hosted)

```bash
# Delete the variable to use default (self-hosted)
gh variable delete RUNNER_TYPE

# Or explicitly set to self-hosted
gh variable set RUNNER_TYPE --body "self-hosted"
```

---

## 🛠️ Troubleshooting

### Runner Not Picking Up Jobs

1. **Check runner status**:
   ```bash
   # On the runner machine
   ./run.sh --check
   ```

2. **Verify labels match**:
   - Check `RUNNER_TYPE` variable matches runner labels
   - View runner labels in GitHub Settings → Actions → Runners

3. **Restart runner**:
   ```bash
   # If running as service
   sudo ./svc.sh restart
   
   # If running manually
   ./run.sh
   ```

### Runner Offline

```bash
# Check if runner process is running
ps aux | grep Runner.Listener

# Check logs
tail -f _diag/Runner_*.log

# Restart service
sudo ./svc.sh restart
```

### Docker Permission Issues

```bash
# Add runner user to docker group
sudo usermod -aG docker runner-user

# Restart Docker
sudo systemctl restart docker

# Logout and login again
```

### Disk Space Issues

```bash
# Clean Docker cache
docker system prune -a --volumes

# Clean runner work directory
rm -rf /path/to/runner/_work/*

# Monitor disk usage
df -h
```

---

## 📊 Monitoring and Metrics

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'github-runner'
    static_configs:
      - targets: ['localhost:9090']
```

### Health Check Script

```bash
#!/bin/bash
# runner-health-check.sh

if ps aux | grep -q "[R]unner.Listener"; then
    echo "✓ Runner is running"
    exit 0
else
    echo "✗ Runner is not running"
    ./svc.sh restart
    exit 1
fi
```

### Automated Monitoring

```bash
# Add to crontab
crontab -e

# Check every 5 minutes
*/5 * * * * /path/to/runner-health-check.sh >> /var/log/runner-health.log 2>&1
```

---

## 🎉 Benefits Summary

| Feature | GitHub-Hosted | Self-Hosted |
|---------|--------------|-------------|
| **Cost** | Minutes limited by plan | Unlimited |
| **Performance** | Standard hardware | Custom hardware |
| **Caching** | Temporary | Persistent |
| **Setup** | Zero setup | Initial setup required |
| **Maintenance** | GitHub managed | Self-managed |
| **Security** | GitHub infrastructure | Your infrastructure |
| **Compliance** | GitHub regions | Your regions |

---

## 📚 Additional Resources

- [GitHub Actions Self-Hosted Runner Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Runner Application API](https://github.com/actions/runner)
- [Security Hardening Guide](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Docker Runner Images](https://github.com/myoung34/docker-github-actions-runner)

---

## 💡 Pro Tips

1. **Use runner groups** for better organization in large teams
2. **Set up autoscaling** with AWS/GCP/Azure for dynamic runner provisioning
3. **Use ephemeral runners** for better security
4. **Monitor runner metrics** with Prometheus/Grafana
5. **Automate runner updates** with cron jobs or systemd timers
6. **Use Docker-in-Docker** for isolated build environments
7. **Configure runner per-workflow** for different resource requirements

---

## 🆘 Support

For issues with self-hosted runners:
1. Check runner logs: `_diag/Runner_*.log`
2. Verify runner connectivity
3. Review workflow run logs in GitHub Actions tab
4. Consult the troubleshooting section above
5. Create an issue in this repository

**Current Configuration**: All workflows **default to GitHub-hosted runners** (`ubuntu-latest`). You can switch to self-hosted runners by setting the `RUNNER_TYPE` repository variable to `self-hosted` or custom labels like `[self-hosted, gpu]`.
