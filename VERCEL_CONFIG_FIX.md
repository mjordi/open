# Vercel Configuration Sync Fix

## Issue Summary

The Production deployment for `open-maogcm5mf-mjordis-projects.vercel.app` has an incorrect build override that uses `npm run serve` instead of `npm run build`.

## Current State

### Production Override (INCORRECT ❌)
- Build Command: `npm run serve`

**Problem**: `npm run serve` is a development server command that runs `http-server` on port 8000. This is NOT a build command and will fail in production deployment.

### Project Settings (CORRECT ✅)
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `frontend/dist`
- Install Command: `npm install`
- Development Command: None

### vercel.json Configuration (CORRECT ✅)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "framework": null,
  "installCommand": "npm install",
  "devCommand": "npm run serve"
}
```

## The Fix

### Step 1: Remove Production Override in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project: **open**
3. Click on **Settings** tab
4. Select **General** from the left sidebar
5. Scroll to **Build & Development Settings**
6. Look for the **Production** section with overrides
7. Click **Edit** next to the build command override
8. **Remove the override** or change it to match `vercel.json`: `npm run build`
9. Click **Save**

### Step 2: Verify Configuration Matches

Ensure these settings match across all environments:

| Setting | Value |
|---------|-------|
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `frontend/dist` |
| Install Command | `npm install` |
| Development Command | `npm run serve` (local only) |

### Step 3: Redeploy

After removing the override:
1. Trigger a new deployment (push to the branch or click "Redeploy" in Vercel)
2. Verify the build uses `npm run build`
3. Check that the deployment succeeds

## Understanding the Build Process

### What `npm run build` does:
```bash
npm run compile      # Compiles Solidity contracts with Hardhat
npm run generate     # Generates frontend artifacts (ABI, bytecode)
node scripts/build-frontend.js  # Builds frontend to frontend/dist/
```

### What `npm run serve` does (DEV ONLY):
```bash
npx http-server frontend/public -p 8000  # Runs local dev server
```

**Key Point**: `serve` is for local development only and does NOT create production builds!

## Verification

After fixing, verify the deployment:

1. Check build logs show `npm run build` execution
2. Verify contracts are compiled
3. Verify frontend artifacts are generated
4. Verify output is in `frontend/dist/`
5. Test the deployed site works correctly

## Configuration Files Updated

- ✅ `AGENTS.md` - Updated Vercel deployment section with correct output directory
- ✅ `vercel.json` - Already correct (no changes needed)
- ✅ `.vercelignore` - Already correct (no changes needed)

## Summary

**Root Cause**: Production deployment has an override using the development server command (`npm run serve`) instead of the build command (`npm run build`).

**Resolution**: Remove the production override in Vercel dashboard so deployments use the correct settings from `vercel.json`.

**Impact**: Once fixed, deployments will properly compile contracts, generate artifacts, and build the frontend for production.
