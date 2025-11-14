This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Google Gemini Pro API Key
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_api_key_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** 
- `GEMINI_API_KEY` is used server-side only (not exposed to client)
- Do NOT use `NEXT_PUBLIC_` prefix for `GEMINI_API_KEY` for security

## Deploy on Vercel

### 1. Push your code to GitHub

### 2. Import project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository

### 3. Configure Environment Variables

In Vercel project settings, add the following environment variables:

- `GEMINI_API_KEY` - Your Google Gemini Pro API key
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (if not already set)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key (if not already set)

**Steps:**
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your API key
   - **Environment:** Production, Preview, Development (select all)
4. Repeat for other variables
5. Redeploy your application

### 4. Deploy

Vercel will automatically deploy your application. The AI features will work once the environment variables are configured.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
