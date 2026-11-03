# Guillermo Cardona Gómez — Portfolio

Static personal CV and portfolio site for Guillermo Cardona Gómez, a Software Engineer. It presents professional experience, skills, education, contact information, and a downloadable resume.

![Portfolio homepage preview](public/images/portfolio-home-preview.png)

## Stack

- Astro 7
- TypeScript
- CSS with responsive design tokens

The site is statically generated and compatible with Vercel deployment.

## Run locally

Use Node.js 22.23.4 or newer.

```sh
npm install
npm run dev
```

The development server is available at `http://localhost:4321`. To start Astro in background mode, use:

```sh
npx astro dev --background
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run build` | Create the static production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run astro -- <command>` | Run an Astro CLI command. |

## Project structure

```text
src/
├── components/
│   ├── layout/       # Header and footer
│   ├── sections/     # Home page sections
│   └── ui/           # Shared UI elements
├── data/             # Canonical English copy and portfolio data
├── i18n/             # Translation lookup and interpolation
├── layouts/          # Shared page layout
├── pages/            # Astro routes
├── styles/           # Global styles and design tokens
└── types/            # Content TypeScript types
public/
├── images/           # Homepage visual assets
└── resume/           # Public downloadable resume
resume/               # Non-public editable resume source
```

## Content

`src/data/en.json` contains visible English copy. `src/data/portfolio.data.json` contains structured profile, experience, skills, education, language, and project data. These files are the source of truth for the site content.

Only projects with `published: true` are shown. The downloadable resume is served from `public/resume/guillermo-cardona-resume.pdf`.

## Verification

Run the production build before publishing changes:

```sh
npm run build
```
