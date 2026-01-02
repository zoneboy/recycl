<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Heptabet - Expert Football Predictions

The premier Nigerian football prediction platform offering expert tips, AI-powered analysis, and high-accuracy forecasts for betting enthusiasts.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key.
3. Run the app:
   `npm run dev`

## Deploy to Netlify

This project is configured for easy deployment on Netlify.

1. **Push to Git**: Ensure your project is committed and pushed to GitHub, GitLab, or Bitbucket.
2. **Create New Site**:
   - Log in to Netlify.
   - Click **"Add new site"** > **"Import an existing project"**.
   - Select your Git provider and repository.
3. **Configure Build**:
   - Netlify should detect the settings from `netlify.toml` automatically:
     - **Build command**: `npm run build`
     - **Publish directory**: `dist`
4. **Set Environment Variables** (Important):
   - Before deploying (or in Site Configuration > Environment variables):
   - Add a new variable named `GEMINI_API_KEY`.
   - Paste your actual Gemini API key as the value.
5. **Deploy**: Click **"Deploy site"**.
