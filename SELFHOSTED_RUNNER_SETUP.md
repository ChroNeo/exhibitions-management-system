# Self-Hosted GitHub Actions Runner Setup

## Why Self-Hosted Runner?

Your server uses a **private IP** (`172.16.10.202`) which GitHub's cloud runners cannot access. A self-hosted runner runs directly on your server, solving this problem.

## Setup Instructions

### Step 1: Go to GitHub Repository Settings

1. Go to your repository on GitHub
2. **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Select **Linux** and **x64**

### Step 2: Install Runner on Your Server

SSH to your server and run these commands:

```bash
# Create a folder for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/YOUR_USERNAME/exhibitions-management-system --token YOUR_TOKEN_FROM_GITHUB

# When prompted:
# - Enter runner name: production-server
# - Enter runner group: Default
# - Enter labels: self-hosted,Linux,X64,production
# - Enter work folder: _work (default)
```

**Note:** Replace `YOUR_USERNAME` and `YOUR_TOKEN_FROM_GITHUB` with values shown on the GitHub page.

### Step 3: Install Runner as a Service

```bash
# Install the service
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### Step 4: Verify Runner is Online

Go back to GitHub → **Settings** → **Actions** → **Runners**

You should see your runner with status: **Idle** (green)

### Step 5: Update Workflow to Use Self-Hosted Runner

The workflow file `.github/workflows/deploy-production-selfhosted.yml` is already created with:

```yaml
runs-on: self-hosted  # Use your server instead of GitHub cloud
```

### Step 6: Disable Old Workflow (Optional)

Rename or delete `.github/workflows/deploy-production.yml` to avoid conflicts:

```bash
git mv .github/workflows/deploy-production.yml .github/workflows/deploy-production.yml.disabled
git commit -m "disable cloud runner workflow"
git push origin prod
```

### Step 7: Test Deployment

```bash
git add .
git commit -m "test: self-hosted runner deployment"
git push origin prod

# Go to GitHub → Actions tab to see it running on your server
```

## How It Works

```
Push to prod
    ↓
GitHub triggers workflow
    ↓
Self-hosted runner on YOUR server picks up the job
    ↓
Runs commands directly on server (no SSH needed)
    ↓
git pull + ./deploy.sh update
    ↓
✅ Done!
```

## Advantages

- ✅ No SSH setup needed
- ✅ Works with private IPs
- ✅ Faster (no network latency)
- ✅ Direct access to Docker and local resources
- ✅ No secrets needed (already on server)

## Managing the Runner

```bash
# Check status
sudo ~/actions-runner/svc.sh status

# Stop runner
sudo ~/actions-runner/svc.sh stop

# Start runner
sudo ~/actions-runner/svc.sh start

# Restart runner
sudo ~/actions-runner/svc.sh restart

# View logs
journalctl -u actions.runner.* -f
```

## Security Notes

- ✅ Runner runs as your user (not root)
- ✅ Only your repository can use this runner
- ✅ GitHub provides the authentication token
- ⚠️ Make sure your server is secure (firewall, updates, etc.)

## Troubleshooting

### Runner shows offline
```bash
sudo ~/actions-runner/svc.sh status
sudo ~/actions-runner/svc.sh restart
```

### Workflow doesn't pick up runner
- Check runner labels match: `self-hosted`
- Verify runner is online in GitHub Settings
- Check runner logs: `journalctl -u actions.runner.* -f`

### Permission errors
```bash
# Make sure deploy.sh is executable
chmod +x ~/exhibitions-management-system/deploy.sh

# Make sure runner user can run docker
sudo usermod -aG docker $USER
```

## Alternative: Use Public IP or VPN

If you don't want to use self-hosted runner:

1. **Get a public IP** for your server
2. **Setup VPN** (Tailscale, WireGuard) and connect GitHub Actions through it
3. **Use ngrok or similar** to expose your server temporarily

But self-hosted runner is the **easiest and most secure** solution for private networks.
