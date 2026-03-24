# CI/CD Setup Guide - GitHub Actions

## Overview

This project uses GitHub Actions for automated deployment to production server.

## Workflows

### 1. **Deploy to Production** (`.github/workflows/deploy-production.yml`)

- **Trigger**: Push to `prod` branch or manual trigger
- **Actions**:
  - Pull latest code on server
  - Run `./deploy.sh update`
  - Verify deployment health

### 2. **Test & Lint** (`.github/workflows/test.yml`)

- **Trigger**: Pull requests to `prod` or push to `develop`
- **Actions**:
  - Run ESLint
  - Build backend and frontend
  - Verify no build errors

## Setup Instructions

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine** or **server**:

```bash
# Generate a new SSH key (no passphrase)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Display the private key (you'll add this to GitHub Secrets)
cat ~/.ssh/github_actions_key

# Display the public key (you'll add this to server)
cat ~/.ssh/github_actions_key.pub
```

### Step 2: Add Public Key to Server

On your **production server**:

```bash
# Add the public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Add Secrets to GitHub Repository

Go to your GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name       | Value                   | Example                                  |
| ----------------- | ----------------------- | ---------------------------------------- |
| `SSH_PRIVATE_KEY` | Private key from Step 1 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_IP`       | Your server IP address  | `172.16.10.202`                          |
| `SERVER_USER`     | SSH username            | `neoce`                                  |

### Step 4: Test the Workflow

```bash
# Make a small change and push to prod
git add .
git commit -m "test: trigger CI/CD"
git push origin prod

# Go to GitHub → Actions tab to see the workflow running
```

## Workflow Diagram

```
┌─────────────────┐
│  Push to prod   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  GitHub Actions Runner  │
│  1. Checkout code       │
│  2. Setup SSH           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  SSH to Server          │
│  1. git pull            │
│  2. ./deploy.sh update  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Verify Health Check    │
│  curl /health           │
└─────────────────────────┘
```

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Production**
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Troubleshooting

### SSH Connection Failed

```bash
# Test SSH connection from your local machine
ssh -i ~/.ssh/github_actions_key neoce@172.16.10.202

# If it works locally but fails in GitHub Actions:
# - Check that SSH_PRIVATE_KEY secret is correct
# - Ensure the private key includes BEGIN and END lines
# - Verify SERVER_IP and SERVER_USER secrets
```

### Deployment Script Failed

```bash
# SSH to server and check logs
ssh neoce@172.16.10.202
cd ~/exhibitions-management-system
docker compose -f infra/docker/docker-compose.prod.yml logs
```

### Health Check Failed

```bash
# Check if services are running
docker compose -f infra/docker/docker-compose.prod.yml ps

# Check backend health
curl http://localhost/health
```

## Best Practices

### Branch Strategy

```
prod (production)
  ↑
  │ PR + Review
  │
develop (staging)
  ↑
  │ PR
  │
feature/* (development)
```

**Recommended workflow:**

1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit
3. Push and create PR to `develop`
4. Test & Lint workflow runs automatically
5. After review, merge to `develop`
6. When ready for production, create PR from `develop` to `prod`
7. Merge to `prod` triggers auto-deployment

### Environment-Specific Deployments

If you want separate staging and production:

1. Create `.github/workflows/deploy-staging.yml`
2. Add staging server secrets: `STAGING_SERVER_IP`, `STAGING_SERVER_USER`
3. Trigger on push to `develop` branch

## Security Notes

- ✅ Never commit `.env.production` to Git
- ✅ Use GitHub Secrets for sensitive data
- ✅ SSH key should have no passphrase for automation
- ✅ Limit SSH key to specific user (not root)
- ✅ Consider using GitHub Environments for approval gates

## Advanced: Add Slack/Discord Notifications

Add to `deploy-production.yml`:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Monitoring

After deployment, monitor:

- GitHub Actions logs
- Server logs: `docker compose logs -f`
- Application health: `http://YOUR_SERVER_IP/health`
