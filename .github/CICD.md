# CI/CD Documentation

## Overview

This project uses GitHub Actions for continuous integration, deployment, and release management. All workflows are designed to ensure code quality, security, and reliable deployments.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### lint-and-format
- Installs dependencies
- Runs TypeScript compilation
- Executes linting checks
- **Duration:** ~2-3 minutes

#### smart-contract-tests
- Compiles smart contracts
- Runs comprehensive test suite (48+ tests)
- Generates coverage reports
- Uploads to Codecov
- **Duration:** ~5-7 minutes

#### contract-size-check
- Analyzes contract sizes
- Ensures contracts fit within deployment limits
- **Duration:** ~2 minutes

#### frontend-tests
- Type checks Next.js frontend
- Builds production frontend
- Uploads build artifacts
- **Duration:** ~3-4 minutes

#### security-analysis
- Runs Slither static analysis
- Performs dependency vulnerability scanning
- Creates security reports
- **Duration:** ~4-5 minutes

#### gas-report
- Generates gas usage reports for all functions
- Tracks optimization improvements
- **Duration:** ~5-6 minutes

#### deployment-preview
- Simulates contract deployment
- Comments PR with build status
- **Runs only on PRs**
- **Duration:** ~2 minutes

#### all-checks-pass
- Validates all previous jobs
- Fails if critical jobs fail
- Provides summary of results
- **Duration:** < 1 minute

**Total Pipeline Duration:** ~15-20 minutes

---

### 2. Deployment Pipeline (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (`v*`)
- Manual workflow dispatch with environment selection

**Jobs:**

#### deploy-contracts
- Runs full test suite before deployment
- Deploys contracts to Sepolia testnet
- Verifies contracts on Etherscan
- Saves deployment artifacts
- **Duration:** ~8-10 minutes
- **Requires secrets:**
  - `PRIVATE_KEY`
  - `SEPOLIA_RPC_URL`
  - `ETHERSCAN_API_KEY`

#### deploy-frontend
- Builds production frontend
- Deploys to Vercel
- **Duration:** ~3-5 minutes
- **Requires secrets:**
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `WALLETCONNECT_PROJECT_ID`
  - `CONTRACT_ADDRESS`

#### post-deployment-tests
- Runs integration tests on Sepolia
- Validates deployed contract functionality
- Creates deployment summary
- **Duration:** ~10-15 minutes

#### notify-deployment
- Sends deployment status notifications
- Creates deployment report
- **Duration:** < 1 minute

**Total Deployment Duration:** ~25-35 minutes

---

### 3. Release Management (`release.yml`)

**Triggers:**
- Push of version tags (e.g., `v1.0.0`, `v1.2.3`)

**Jobs:**

#### create-release
- Generates changelog from git history
- Creates release archive with artifacts
- Creates GitHub release with notes
- Marks pre-releases (beta/alpha)
- **Duration:** ~3-4 minutes

#### publish-npm
- Publishes package to npm (optional)
- Only for stable releases (non-beta/alpha)
- **Duration:** ~2-3 minutes
- **Requires secret:** `NPM_TOKEN`

#### docker-build
- Builds Docker image for frontend
- Pushes to Docker Hub
- **Duration:** ~5-7 minutes
- **Requires secrets:**
  - `DOCKER_USERNAME`
  - `DOCKER_PASSWORD`

#### notify-release
- Creates release summary
- Sends notifications
- **Duration:** < 1 minute

**Total Release Duration:** ~10-15 minutes

---

## Required Secrets

Configure these in GitHub repository settings: `Settings > Secrets and variables > Actions`

### Essential Secrets

| Secret | Purpose | Example |
|--------|---------|---------|
| `PRIVATE_KEY` | Deploy wallet private key | `0xabc...` |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://sepolia.infura.io/v3/...` |
| `ETHERSCAN_API_KEY` | Contract verification | `ABC123...` |

### Frontend Deployment

| Secret | Purpose | Where to Find |
|--------|---------|---------------|
| `VERCEL_TOKEN` | Vercel API token | Vercel Settings > Tokens |
| `VERCEL_ORG_ID` | Organization ID | Vercel project settings |
| `VERCEL_PROJECT_ID` | Project ID | Vercel project settings |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect | WalletConnect Cloud |
| `CONTRACT_ADDRESS` | Deployed contract | After deployment |

### Optional Secrets

| Secret | Purpose | When Needed |
|--------|---------|-------------|
| `COINMARKETCAP_API_KEY` | Gas price USD conversion | Gas reporting |
| `NPM_TOKEN` | npm publishing | Package distribution |
| `DOCKER_USERNAME` | Docker Hub login | Docker publishing |
| `DOCKER_PASSWORD` | Docker Hub password | Docker publishing |
| `CODECOV_TOKEN` | Coverage uploads | Private repos |

---

## Setting Up CI/CD

### 1. Fork/Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/logistics-optimizer.git
cd logistics-optimizer
```

### 2. Configure Secrets

1. Go to repository settings on GitHub
2. Navigate to: `Settings > Secrets and variables > Actions`
3. Click "New repository secret"
4. Add each required secret from the table above

### 3. Enable GitHub Actions

1. Go to `Actions` tab in your repository
2. If prompted, click "I understand my workflows, go ahead and enable them"
3. Workflows will now run automatically on push/PR

### 4. Test CI Locally

Before pushing, test locally:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run tests
npm test

# Check coverage
npm run test:coverage

# Build frontend
cd logistics-optimizer && npm run build

# Type check
npm run type-check
```

### 5. Create First Release

```bash
# Tag version
git tag -a v1.0.0 -m "Release v1.0.0"

# Push tag
git push origin v1.0.0

# GitHub Actions will automatically create release
```

---

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/deploy.yml)
[![Release](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/release.yml/badge.svg)](https://github.com/YOUR_USERNAME/logistics-optimizer/actions/workflows/release.yml)
```

---

## Monitoring Workflows

### View Workflow Runs

1. Go to `Actions` tab
2. Select workflow (CI, Deploy, Release)
3. Click on specific run to see details
4. View logs for each job

### Debug Failed Runs

1. Click on failed job
2. Expand failing step
3. Review error messages
4. Check "Re-run jobs" if transient failure

### Workflow Logs

Logs include:
- Compilation output
- Test results
- Deployment information
- Gas usage reports
- Security scan results

---

## Best Practices

### 1. Branch Protection

Configure branch protection rules:

```
Settings > Branches > Add rule

Branch name pattern: main
✓ Require status checks to pass before merging
  ✓ smart-contract-tests
  ✓ frontend-tests
✓ Require branches to be up to date
```

### 2. PR Workflow

1. Create feature branch
2. Make changes
3. Push branch
4. Create PR to `main`
5. Wait for CI checks to pass
6. Review and merge

### 3. Deployment Workflow

1. Merge PR to `main`
2. Deployment workflow triggers automatically
3. Monitor deployment progress
4. Verify deployment on Sepolia
5. Test frontend at Vercel URL

### 4. Release Workflow

1. Ensure `main` is stable
2. Create version tag: `git tag v1.x.x`
3. Push tag: `git push origin v1.x.x`
4. Release workflow creates GitHub release
5. Optional: npm and Docker images published

---

## Troubleshooting

### Common Issues

#### Failed Tests
- **Cause:** Test failures in contract or frontend
- **Solution:** Run `npm test` locally, fix issues, push fix

#### Deployment Failure
- **Cause:** Invalid secrets or insufficient balance
- **Solution:** Verify secrets, ensure deployer has ETH

#### Verification Failure
- **Cause:** Etherscan API timeout or invalid key
- **Solution:** Re-run verification manually: `npm run verify:sepolia`

#### Frontend Build Error
- **Cause:** Missing environment variables
- **Solution:** Check `.env.local` configuration

#### Security Scan Warnings
- **Cause:** Potential vulnerabilities detected
- **Solution:** Review Slither output, address issues

---

## Performance Optimization

### Cache Strategy

Workflows use caching for:
- `node_modules` - npm dependencies
- Build artifacts - compiled contracts
- Coverage data - test reports

### Parallel Execution

Jobs run in parallel when possible:
- Contract tests + Frontend tests
- Security scan + Gas report
- Multiple deployment environments

### Resource Limits

- **Timeout:** 60 minutes per workflow
- **Job timeout:** 40 minutes per job
- **Artifact retention:** 90 days for deployments, 7 days for builds

---

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets

### Access Control

- Limit who can trigger deployments
- Require code review before merge
- Enable 2FA for all contributors
- Monitor workflow runs for anomalies

### Audit Trail

- All deployments logged in GitHub
- Contract addresses recorded
- Deployment artifacts saved
- Transaction hashes preserved

---

## CI/CD Metrics

Track these metrics:

- **Test Pass Rate:** Should be 100%
- **Coverage:** Target > 90%
- **Deployment Success Rate:** Target > 95%
- **Average CI Duration:** Target < 20 minutes
- **Deployment Duration:** Target < 35 minutes

---

## Continuous Improvement

### Regular Tasks

- **Weekly:** Review failed workflows
- **Monthly:** Update dependencies
- **Quarterly:** Audit secrets and access
- **Yearly:** Review workflow efficiency

### Enhancement Opportunities

- Add more security scanners (Mythril, Echidna)
- Implement automatic rollback on failure
- Add performance benchmarking
- Create staging environment
- Add E2E tests for frontend

---

## Support

For issues with CI/CD:

1. Check workflow logs in Actions tab
2. Review this documentation
3. Check GitHub Actions documentation
4. Open issue in repository

---

*Last Updated: 2025-10-23*
