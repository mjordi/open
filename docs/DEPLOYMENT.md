# Deployment Guide

This project uses [Vercel](https://vercel.com) for automatic deployments and PR previews.

## Quick Setup (5 minutes)

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 2. Import Your Repository

1. Click **"Add New..."** → **"Project"**
2. Find and select `mjordi/open` from your repositories
3. Click **"Import"**

### 3. Configure Project (Auto-detected)

Vercel will automatically detect the settings from `vercel.json`:

- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install`

Click **"Deploy"** - that's it! 🎉

## What You Get

### Production Deployment
- **URL**: `https://open-[your-username].vercel.app`
- **Trigger**: Every push to `main`/`master` branch
- **Status**: Check deployment status in Vercel dashboard

### PR Preview Deployments
- **URL**: `https://open-git-[branch-name]-[your-username].vercel.app`
- **Trigger**: Automatically created for every pull request
- **Comment**: Vercel bot comments on PRs with preview URL
- **Updates**: Automatically updates on every commit to the PR

### Features

✅ **Zero Configuration** - Works out of the box
✅ **Automatic HTTPS** - SSL certificates included
✅ **Global CDN** - Fast loading worldwide
✅ **Build Logs** - Debug failed builds easily
✅ **Environment Variables** - Set via Vercel dashboard
✅ **Custom Domains** - Add your own domain (optional)

## Local Development

```bash
# Install dependencies
npm install

# Build the frontend
npm run build

# Serve locally (requires http-server)
npm run serve

# Visit http://localhost:8000
```

## Environment Variables

If you need environment variables for production:

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Add variables (e.g., `API_URL`, `CONTRACT_ADDRESS`)
3. Redeploy to apply changes

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`

### Files Missing in Deployment

- Check `vercel.json` output directory is correct
- Verify `scripts/build-frontend.js` copies all necessary files
- Look for errors in build logs

### Preview URL 404

- Wait 1-2 minutes for deployment to complete
- Check deployment status in Vercel dashboard
- Ensure build completed successfully

## Alternative: GitHub Pages

If you prefer GitHub Pages instead of Vercel:

1. The workflows were removed in favor of Vercel
2. You can restore from git history if needed
3. GitHub Pages requires manual workflow setup and is slower

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [GitHub Issues](https://github.com/mjordi/open/issues)
