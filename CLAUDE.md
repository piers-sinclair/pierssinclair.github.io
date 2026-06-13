# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # generate RSS feed + start Vite dev server
npm run build      # generate RSS feed + production build
npm run lint       # ESLint
npm test           # Jest
npm run generate:rss  # regenerate public/feed.xml standalone
```

## Architecture

This is a Vite + React 19 + TypeScript blog. Blog content is static Markdown in `public/posts/`; the React app fetches and renders it client-side.

### Post loading pipeline

1. `public/posts/posts.json` — ordered array of slugs (filenames without `.md`). This is the only index; a post not listed here will never appear on the site.
2. `src/lib/postUtils.ts` — `fetchPosts()` iterates `posts.json`, fetches each `.md` via `fetch()`, and parses front matter with the `front-matter` package.
3. Posts render at `/post/:slug` and `/about/:slug` via `src/pages/post/Post.tsx`, which uses `MarkdownRenderer` (react-markdown + remark-gfm + react-syntax-highlighter) and appends Giscus comments.

### Adding a post

Two things must happen or the post won't appear:

1. Create `public/posts/YYYY-MM-DD-Title-Case-With-Dashes.md` with required front matter:
   ```markdown
   ---
   layout: post
   title: 📦 Emoji Then Title Case Headline
   date:  2026-06-06 01:00:00 +1000
   categories: dotnet
   tags: dotnet, cli, ci-cd
   author: Piers Sinclair
   published: true
   ---
   ```
2. Append the slug to `public/posts/posts.json`.

Images live in `public/assets/images/<slug>/1.png`, `2.png`, ... Diagrams (draw.io) go in `public/assets/diagrams/<slug>/`.

### RSS feed

`src/lib/generateRss.ts` runs at build time via `tsx` and writes `public/feed.xml`. It reads all `.md` files directly from disk (not via the browser `fetch` path), skipping any with `published: false` or missing required fields.

### Routing

| Path | Component |
|------|-----------|
| `/` | `src/pages/home/Home.tsx` — sorted post list |
| `/post/:slug` | `src/pages/post/Post.tsx` |
| `/about/:slug` | `src/pages/post/Post.tsx` |
| `/reading-list` | `src/pages/reading-list/ReadingList.tsx` |

### Skill

Use the `/write-blog-post` skill when drafting or publishing a post. It encodes the full voice guide, structural patterns, front matter requirements, `posts.json` wiring, and PR workflow in one place.
