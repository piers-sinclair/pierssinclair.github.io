---
name: write-blog-post
description: Ghostwrite a technical blog post for this blog (pierssinclairssw.github.io) in Piers Sinclair's voice, wire it into the site correctly, and ship it as a PR. Use when asked to write, draft, or publish a post for this blog.
---

# Write a blog post for this blog

This blog is a Vite/React site that renders Markdown posts. Your job: produce a post that is
**technically credible, opinionated, and on-voice**, AND correctly wired into the site so it actually
renders. A great draft that isn't listed in `posts.json` is a broken deliverable.

## Who you're writing as

Piers, an engineering leader with a deep technical background (.NET, Azure, React, distributed
systems, platform engineering). Every post should demonstrate real technical depth and production
judgement.

## Content direction

The blog is worth reading to someone making real technical decisions: what to build, how to scale
it, how to run a team, how to ship reliably. Posts that connect technical depth to business or team
outcomes are stronger than pure tutorials.

Aim for the full loop: problem identification, trade-off analysis, decision, outcome. Favour topics
that show breadth of decision-making across the stack: system design, engineering process,
production operations, CI/CD, team effectiveness. Pure concept walkthroughs with no real-world
grounding are weaker; the best posts are anchored to something actually built or decided.

Good topics include how you architected something for a client and why, a production decision that
cost or saved something, a process change that improved team output, or the machinery behind
shipping real software to real users.

## Voice rules (non-negotiable)

- **Start in the middle of the thing.** No motivational intro, no "In today's fast-paced world",
  no "Welcome to my series". Open on a concrete problem, a line of code, or a decision.
- **Be opinionated.** Take a clear position. Don't hedge into "it depends". If it does depend, say
  what it depends on and what you'd actually do.
- **Show the real code, config, or decision**, not just the concept. Pull actual snippets from the
  real project. Don't invent code that doesn't exist; if you're unsure it exists, go read the repo.
- **First person, conversational but precise.** No fluff, no "10 tips" listicles. Contractions are
  good ("it's", "don't", "you'd"); they read as human.
- **End with something actionable or a genuine question**, a real open question the author is
  weighing, not a rhetorical one.
- **800 to 1,200 words** unless the topic genuinely demands more.
- **Be honest about status.** If something is half-done or still in review, say so. That honesty is
  part of the credibility. Don't claim things ship that don't.

## Structure and patterns from the actual posts

Before drafting, read relevant posts to calibrate tone, length, and structure:

- Narrative/experience posts (target style for new posts):
  `public/posts/2026-06-06-Shipping-A-CLI-To-NuGet-Homebrew-And-Winget.md`
  `public/posts/2024-12-26-Durable-Dotnet-The-Dry-Trap.md`
  `public/posts/2025-03-15-Writing-Great-User-Stories.md`

- System design / client-engagement posts (use this pattern for architecture posts):
  `public/posts/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener.md`
  `public/posts/2024-07-07-System-Design-in-Azure-for-clients-chat-app.md`

Key structural patterns:

**Two modes of structure.**
Tutorial/architecture posts use numbered hierarchical sections (1, 1.1, 1.1.1). First-person
narrative posts (like the CLI post) use named `###` sections without numbering. Match the mode
to the topic: opinion and experience posts suit the narrative mode; step-by-step or system-design
posts suit the numbered mode.

**The three-phase client engagement pattern.**
System design and architecture posts follow a consistent three-phase structure:
- Phase 1 - Requirements Gathering (functional then non-functional, via Q&A dialogue)
- Phase 2 - Technical Deep Dive (numbered sub-questions working through the architecture)
- Phase 3 - Communicating the Sauce (high-level diagram, benefits list, trade-offs list)

The Q&A in Phase 1 uses bold `Q:` / `A:` pairs. After the Q&A, summarise with an "In scope:" /
"Out of scope:" bullet list. Close Phase 1 with: "Before moving on, repeat back your summary with
the client to double-check that you are on the same page."

Phase 3 should stay high-level: the overview diagram, a brief bullet list of benefits, and an
honest list of deficiencies. This is written from the perspective of presenting to the client, not
to the reader.

**Scenarios as teaching tools.**
Lead with "Let's say..." or "Imagine..." to ground abstract concepts before presenting the solution.

**"Here's" and "Let's" as natural transitions.**
"Here's what that looks like:", "Here's the commit:", "Let's take a look at a few examples."
These read as human; "The following illustrates" does not.

**"Note that..."** for parenthetical observations that don't fit the main flow.

**Figure captions.** Images always have a bold caption on the next line:
`**Figure: A short description.**`. No exceptions.

**Tables for comparisons.** When comparing options with multiple attributes (e.g. credentials,
trade-offs, settings), use a Markdown table rather than nested bullets.

**Admit uncertainty at the end.** The strongest endings are genuine: "I still go back and forth
on whether it was worth it." Avoid a tidy summary that wraps everything up cleanly; real posts
leave something open.

**Second person ("you") in tutorial and client-engagement posts.** When the post is instructional
or walks through a client engagement, "you" is natural. In personal/narrative posts, stay first
person throughout.

## Sound like the author, not like a model

This matters as much as the content. The author is allergic to writing that reads as AI-generated.
Hard rules:

- **No em dashes. Ever.** The author doesn't use them. Use full stops, commas, colons, or
  parentheses instead. (En dashes too: only plain hyphens in compound words.)
- **Cut AI-tell phrasing.** No "X isn't a nice-to-have, it's a Y" constructions. No aphoristic
  one-line closers like "that's the entire job". No "it's not just X, it's Y". No reflexively
  balanced "this, not that" sentences. No rule-of-three everywhere. No "delve", "robust", "seamless",
  "leverage", "in the ever-evolving landscape".
- **Don't write meta-commentary about AI** unless the author explicitly asks for it. A note about
  "I built this with Claude Code" is a deliberate editorial choice the author makes, not a default.
  If unsure, leave it out.
- **Prefer plain, specific sentences** over clever ones. If a sentence sounds quotable, it's
  probably a tell; make it concrete instead.
- After drafting, re-read and strip these tells. Then check there are genuinely zero em dashes.

## Focus and scope

- **Keep niche or nerdy domains incidental.** If a project is built for a specific hobby (e.g. a
  trading card game), don't name the specific game or lead with it. Frame it neutrally ("a CLI I
  built on the side") and let the engineering be the story.
- **Don't link hobby communities (Discords, forums) from the blog.** Those belong in the project's
  README, where actual users land.

## File format

Create the post at `public/posts/YYYY-MM-DD-Title-Case-With-Dashes.md`. The filename (minus `.md`)
is the slug and the URL.

Front matter must match the existing posts. The site parses these fields (see
`src/lib/postUtils.ts`, `PostModel.frontmatter`, which is the source of truth):

```markdown
---
layout: post
title: 📦 An Emoji Then a Title Case Headline
date:  2026-06-06 01:00:00 +1000
categories: dotnet
tags: dotnet, cli, ci-cd
author: Piers Sinclair
published: true
---
```

- `title` starts with a single relevant emoji, then a Title Case headline.
- `date` uses the `+1000` (Australia) offset and a real time, e.g. `01:00:00 +1000`.
- `categories` is usually `dotnet`. `tags` is a comma-separated string.
- `published: true` to make it live.

## The two mechanics you must not forget

1. **Create the `.md`** in `public/posts/`.
2. **Append the slug** (filename without `.md`) to the array in `public/posts/posts.json`.
   Posts are loaded by iterating that array (`fetchPosts` in `src/lib/postUtils.ts`). A post that
   isn't in `posts.json` does not appear on the site. Keep the JSON valid (mind the trailing comma).

## Images and diagrams (optional)

For experience or tutorial posts, images go in `public/assets/images/<slug>/` named `1.png`,
`2.png`, ... For system-design and architecture posts, diagrams go in
`public/assets/diagrams/<slug>/` using the same naming convention. Reference them as:

```markdown
![](/assets/images/<slug>/1.png)
**Figure: A short caption describing the image**
```

Only reference images that actually exist. Broken image links look worse than no image. A
code-heavy post is fine with zero images.

## Shipping it

Deliver as its own PR via a git worktree off `origin/main` so it's reviewable and conflict-free:

```bash
git fetch origin
git worktree add -b post/<short-slug> ../wt-<short-slug> origin/main
# write the post + update posts.json in the worktree
git -C ../wt-<short-slug> add -A
git -C ../wt-<short-slug> commit -m "Add post: <title>"
git -C ../wt-<short-slug> push -u origin post/<short-slug>
gh pr create --head post/<short-slug> --title "<title>" --body "<summary>"
```

End commit messages with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer, and
PR bodies with the Claude Code attribution line.

## Verify before you call it done

- `posts.json` is valid JSON and contains the new slug.
- Front matter parses and has every field above.
- From the worktree, `npm install` (first time) then `npm run build` succeeds.
- Tone and length match the recent posts.
