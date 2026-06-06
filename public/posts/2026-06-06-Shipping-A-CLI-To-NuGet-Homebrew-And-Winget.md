---
layout: post
title: 📦 Shipping One CLI to NuGet, Homebrew and winget From a Single Version Bump
date:  2026-06-06 01:00:00 +1000
categories: dotnet
tags: dotnet, cli, ci-cd, devops, distribution, github-actions, homebrew, winget, nuget
author: Piers Sinclair
published: true
---

Three people want my Yu-Gi-Oh! card pool tool. A .NET developer wants `dotnet tool install -g`. A Mac user wants `brew install`. A Windows user wants `winget install`. They expect the same binary, the same version, working the same way — and none of them care that those are three completely different package ecosystems with three different submission processes.

The only thing I want to do to ship to all of them is bump one number.

Here's the commit that releases [cardpool](https://github.com/piers-sinclair/cardpool):

```xml
<Version>1.2.3</Version>
```

That's it. Merge that to `main` and the rest happens on its own. I built most of cardpool — the CLI and this pipeline both — with Claude Code, so the work was never typing the YAML; it was deciding what the YAML should be. This post is the machinery behind that line, and the one package manager that still refuses to be fully automated.

### One project, three artifacts

The trick that makes this manageable is that the CLI is a single .NET project that knows how to be packaged three different ways. The `.csproj`:

```xml
<OutputType>Exe</OutputType>
<AssemblyName>cpool</AssemblyName>
<PackAsTool>true</PackAsTool>
<ToolCommandName>cpool</ToolCommandName>
<PackageId>CardPool</PackageId>
<Version>1.2.3</Version>
```

`PackAsTool` makes `dotnet pack` produce a NuGet global tool — that covers the .NET crowd for free. For everyone else I publish self-contained, single-file executables per platform. No runtime to install, no `dotnet` on the machine. One `cpool.exe` (or `cpool`) that just runs.

Homebrew and winget don't actually *host* binaries — they host *recipes* that point at binaries. So the real distribution artifact for both is a GitHub Release with five zips attached: `win-x64`, `win-arm64`, `osx-arm64`, `osx-x64`, `linux-x64`. Build those once and both package managers are just metadata on top.

### The pipeline is triggered by the version, not a tag

Most release pipelines trigger on a pushed tag. I trigger on the *file* that holds the version:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/CardPool.Cli/CardPool.Cli.csproj'
```

I don't want to remember to tag. I want the version to live in exactly one place — the project file that already has to be correct for NuGet anyway — and have everything else derive from it.

The catch with this approach: that path filter fires on *any* push that touches the csproj, not just version bumps. Add a package reference, edit the description, and the release job wakes up. So the first job's only purpose is to decide whether there's actually anything to do:

```yaml
VERSION=$(grep -oP '(?<=<Version>)[^<]+' src/CardPool.Cli/CardPool.Cli.csproj)
TAG="v${VERSION}"
if gh release view "${TAG}" &>/dev/null; then
  echo "should-release=false" >> $GITHUB_OUTPUT
else
  echo "should-release=true" >> $GITHUB_OUTPUT
fi
```

If a release for that version already exists, stop. That one check is what makes the whole pipeline idempotent — I can re-run it, push unrelated csproj edits, or retry a half-failed run, and it will never double-publish. Idempotency isn't a nice-to-have in a release pipeline; it's the difference between "re-run the job" and "manually clean up a botched release at 11pm".

When it does decide to release, the build is a boring loop:

```yaml
- name: Publish all platforms
  run: |
    for rid in win-x64 win-arm64 osx-arm64 osx-x64 linux-x64; do
      dotnet publish src/CardPool.Cli -p:PublishProfile=$rid -o dist/$rid --no-restore
    done
```

Zip each output, `softprops/action-gh-release` creates the tagged Release with the zips attached, `dotnet nuget push --skip-duplicate` ships NuGet. NuGet is now done. The Release being *published* is the event the other two package managers listen for.

### Homebrew: never hand-edit the tap

A Homebrew tap is just a git repo full of Ruby formula files. The naive way to maintain one is to open it after each release and paste in the new version and SHA256 hashes by hand. That is exactly the kind of manual, error-prone step I'm trying to delete.

So the formula lives in *cardpool's* repo as the single source of truth, with placeholder hashes:

```ruby
if OS.mac? && Hardware::CPU.arm?
  url "https://github.com/piers-sinclair/cardpool/releases/download/v#{version}/cpool-osx-arm64.zip"
  sha256 "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
```

On release, a workflow downloads the actual zips, hashes them, and stamps the real values into a copy before pushing it to the tap:

```bash
get_sha256() { curl -fsSL "$1" | sha256sum | awk '{print $1}'; }
SHA_OSX_ARM64=$(get_sha256 "${BASE}/cpool-osx-arm64.zip")
# ...awk swaps each placeholder for the real hash, then commits to the tap repo
```

The rule I hold to: **the tap is an output, never an input.** I never edit `homebrew-cpool` directly. If the install logic or description changes, it changes in `packaging/homebrew/cpool.rb` here and takes effect on the next release. The tap is generated, the same way `dist/` is.

And because "it pushed" isn't the same as "it works", a smoke-test workflow runs straight after and actually `brew install`s the formula on both macOS and Linux runners. If the hash is wrong or the zip layout changed, I find out from a red check, not from a user.

Homebrew is live. `brew install cpool` works today.

### winget: the one a human still has to approve

winget is the holdout. You don't publish to winget — you open a pull request against [`microsoft/winget-pkgs`](https://github.com/microsoft/winget-pkgs), a single enormous repo Microsoft owns, and wait for their bot (and sometimes a human) to review and merge it.

The submission itself is automated:

```yaml
- uses: vedantmgoyal9/winget-releaser@v2
  with:
    identifier: PiersSinclair.CardPool
    installers-regex: 'cpool-win-(x64|arm64)\.zip$'
    token: ${{ secrets.WINGET_TOKEN }}
```

That generates the manifest — a zip installer with a `portable` nested type and a `PortableCommandAlias: cpool` so the command lands on PATH — and opens the PR with real hashes. But then it sits in someone else's queue. As I write this, NuGet and Homebrew are live and the winget PR is still working its way through review.

That gap is the honest reality of multi-channel distribution: the channels you fully control update in seconds, and the ones gatekept by a third party move on their schedule, not yours. I'd rather have an automated PR waiting in a queue than be hand-writing YAML manifests, but it's a useful reminder that "automated" and "instant" aren't the same word.

### Three tokens, least privilege

Three publish targets means three credentials, and a release pipeline is a juicy thing to compromise — it pushes signed-ish artifacts to places people install from. So none of them are broad:

| Secret | Scope |
|--------|-------|
| `NUGET_API_KEY` | scoped to the `CardPool` package only |
| `WINGET_TOKEN` | classic PAT, `public_repo` only |
| `HOMEBREW_TAP_TOKEN` | fine-grained PAT, the tap repo only, Contents read/write |

If any single one leaks, the blast radius is one package or one repo, not my whole account. For a hobby CLI that's mild paranoia; for anything your company ships it's table stakes. The time to scope tokens tightly is before you need the lesson.

### Who actually wrote this

Worth being straight about, because it's the most interesting part: I built most of this with Claude Code.

> The agent wrote the five publish profiles and the `awk` hash-stamping in seconds. What it didn't do was decide to trigger on the version file instead of a tag, that the release had to be idempotent, or that the tap should be generated output rather than hand-maintained. That's the part that still matters — knowing which YAML you actually want, and why, not typing it.

The grunt work is cheap now. The judgement about what "correct" looks like, and pushing back when the first answer isn't it, is the entire job.

### The takeaway

Distribution is a feature. It's the feature that decides whether anyone actually runs the thing you built, and it's worth the same engineering rigour as the code — automate it once, make it idempotent, and treat every published artifact as generated output rather than something you maintain by hand.

The whole pipeline is in the [cardpool repo](https://github.com/piers-sinclair/cardpool) if you want to lift it for your own .NET CLI.

One genuine question I keep going back and forth on: for a small tool, is shipping to all three channels worth it, or is a single `dotnet tool install -g` (or a `curl | sh`) enough, and the rest is vanity? I went wide. I'm not certain I was right.
