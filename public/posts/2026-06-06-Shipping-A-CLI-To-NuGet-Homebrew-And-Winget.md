---
layout: post
title: 📦 Shipping One CLI to NuGet, Homebrew and winget From a Single Version Bump
date:  2026-06-06 01:00:00 +1000
categories: dotnet
tags: dotnet, cli, ci-cd, devops, distribution, github-actions, homebrew, winget, nuget
author: Piers Sinclair
published: true
---

I built a small CLI, and I wanted three different kinds of people to be able to install it. A .NET developer reaches for `dotnet tool install -g`. A Mac user wants `brew install`. A Windows user wants `winget install`. They expect the same binary, the same version, working the same way, and none of them care that those are three completely different package ecosystems with three different submission processes.

The only thing I want to do to ship to all of them is bump one number.

Here's the commit that releases [cardpool](https://github.com/piers-sinclair/cardpool):

```xml
<Version>1.2.3</Version>
```

That's it. Merge that to `main` and the rest happens on its own. I built most of cardpool with Claude Code, the pipeline included, so the time went into deciding how the release should behave rather than typing the YAML by hand. This post is the machinery behind that line, and the one package manager that still refuses to be fully automated.

### One project, three artifacts

The thing that makes this manageable is that the CLI is a single .NET project that knows how to be packaged three different ways. The `.csproj`:

```xml
<OutputType>Exe</OutputType>
<AssemblyName>cpool</AssemblyName>
<PackAsTool>true</PackAsTool>
<ToolCommandName>cpool</ToolCommandName>
<PackageId>CardPool</PackageId>
<Version>1.2.3</Version>
```

`PackAsTool` makes `dotnet pack` produce a NuGet global tool, which covers the .NET crowd for free. For everyone else I publish self-contained, single-file executables per platform. No runtime to install, no `dotnet` on the machine. One `cpool.exe` (or `cpool`) that just runs.

Homebrew and winget don't host binaries themselves. They host a recipe that points at a binary somewhere else. So the real artifact for both is one GitHub Release with five zips attached: `win-x64`, `win-arm64`, `osx-arm64`, `osx-x64`, `linux-x64`. winget points at the two Windows zips, Homebrew at the three for macOS and Linux. Build them once and each package manager is just metadata sitting on top.

### The pipeline is triggered by the version, not a tag

Most release pipelines trigger on a pushed tag. I trigger on the file that holds the version:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/CardPool.Cli/CardPool.Cli.csproj'
```

I don't want to remember to tag anything. I want the version to live in exactly one place, the project file that already has to be correct for NuGet, and have everything else derive from it.

The catch is that the path filter fires on any push that touches the csproj, not just version bumps. Add a package reference or edit the description and the release job wakes up. So the first job's only purpose is to decide whether there's actually anything to do:

```yaml
VERSION=$(grep -oP '(?<=<Version>)[^<]+' src/CardPool.Cli/CardPool.Cli.csproj)
TAG="v${VERSION}"
if gh release view "${TAG}" &>/dev/null; then
  echo "should-release=false" >> $GITHUB_OUTPUT
else
  echo "should-release=true" >> $GITHUB_OUTPUT
fi
```

If a release for that version already exists, stop. That single check is what lets me re-run the pipeline without thinking about it. I can retry a half-finished run, or push an unrelated csproj edit, and it will never publish the same version twice.

When it does decide to release, the build is a boring loop:

```yaml
- name: Publish all platforms
  run: |
    for rid in win-x64 win-arm64 osx-arm64 osx-x64 linux-x64; do
      dotnet publish src/CardPool.Cli -p:PublishProfile=$rid -o dist/$rid --no-restore
    done
```

Zip each output, a GitHub Action (`softprops/action-gh-release`) creates the tagged Release with the zips attached, and `dotnet nuget push --skip-duplicate` ships NuGet. NuGet is now done. The Release being published is the event the other two package managers wait for.

### Homebrew: never hand-edit the tap

A Homebrew tap is just a git repo full of Ruby formula files. The naive way to maintain one is to open it after each release and paste in the new version and SHA256 hashes by hand. That is exactly the kind of manual, error-prone step I'm trying to delete.

So the formula lives in cardpool's own repo as the single source of truth, with placeholder hashes:

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

The rule I hold to is that the tap is an output, never an input. I never edit `homebrew-cpool` directly. If the install logic or the description changes, it changes in `packaging/homebrew/cpool.rb` here and takes effect on the next release. The tap is generated, the same way `dist/` is.

Pushing the formula is not the same as the formula working, so a smoke-test workflow runs straight after and actually installs `cpool` from the tap on both macOS and Linux runners. If a hash is wrong or the zip layout changed, I find out from a red check, not from a user.

Homebrew is live. `brew install cpool` works today.

### winget: the one a human still has to approve

winget is the holdout, and it's the channel I'm least sure of as I write this. You don't publish to winget the way you push to NuGet. You open a pull request against [`microsoft/winget-pkgs`](https://github.com/microsoft/winget-pkgs), a single enormous repo that Microsoft owns, and wait for their review to merge it.

There's a catch I didn't appreciate at first. The action I wanted to lean on, `winget-releaser`, only updates a package that already exists in that repo. It takes the previous version's manifest as a base and bumps it to the new one. A package that has never been on winget has nothing to bump from, so the very first version has to go in by hand. I'm doing that now with Microsoft's `wingetcreate`, which generates the initial manifest and opens that first pull request for me.

Once that first version is accepted, the automation takes over for every release after it:

```yaml
- uses: vedantmgoyal9/winget-releaser@v2
  with:
    identifier: PiersSinclair.CardPool
    installers-regex: 'cpool-win-(x64|arm64)\.zip$'
    token: ${{ secrets.WINGET_TOKEN }}
```

That generates the new manifest (a zip installer with a `portable` nested type and a `PortableCommandAlias` of `cpool` so the command lands on PATH) and opens the version-bump PR with real hashes. I haven't watched it run for real yet, and I can't until the package exists, so winget is the one channel I won't call done.

That is just how multi-channel distribution works. The channels you fully control update in seconds. The ones gatekept by a third party move on their schedule, not yours, and sometimes they make you do the first step by hand. I would still rather submit one version manually and automate the rest than hand-write a manifest every release, but automated and instant are not the same thing.

### Three tokens, least privilege

Three publish targets means three credentials, and a release pipeline is a tempting thing to compromise, because it pushes artifacts to places people install from without looking. So none of the tokens are broad:

| Secret | Scope |
|--------|-------|
| `NUGET_API_KEY` | scoped to the `CardPool` package only |
| `WINGET_TOKEN` | classic PAT, `public_repo` only |
| `HOMEBREW_TAP_TOKEN` | fine-grained PAT, the tap repo only, Contents read/write |

If any one of them leaks, the damage is one package or one repo, not my whole account. For a hobby CLI that is mild paranoia. For anything a company ships it is the baseline. The time to scope a token tightly is before you have a reason to.

A few things this pipeline deliberately doesn't do yet, and I'd rather name them than pretend.

The binaries aren't signed. Signing is a stamp that proves who published an app and that no one altered it on the way to you. Without it, the first time someone runs cpool, Windows and macOS show a warning that it comes from an unknown developer. That's the SmartScreen prompt on Windows and the Gatekeeper prompt on macOS. The download is fine, but the operating system has no way to confirm that, so it assumes the worst. There's also nothing a user can check to prove the file they downloaded was really built from my code by my pipeline, rather than swapped out somewhere along the way.

The other gap is in the automation. I point at the third-party tools in my workflows by a moving label like `@v2` instead of one exact version. The part most people don't realise is that a label like `@v2` can be repointed at any time, including by whoever ends up in control of the tool behind it. That isn't hypothetical. In early 2025 a widely used Action called `tj-actions/changed-files` was [hijacked exactly this way](https://www.theregister.com/2025/03/17/supply_chain_attack_github/): its version tags were quietly moved to point at malicious code, and it leaked secrets out of more than 23,000 projects' build pipelines before anyone caught it. Pinning each tool to a specific frozen version, an exact commit rather than a moving label, would have side-stepped that, and I haven't done it here yet.

For a tool this size I've accepted these trade-offs, but they're the first things I'd harden before shipping anything like this for commercial use.

### The takeaway

Distribution is a feature. It decides whether anyone actually runs the thing you built, and it deserves the same care as the code. Automate it once, make it safe to re-run, and treat everything you publish as generated output rather than something you maintain by hand.

The whole pipeline is in the [cardpool repo](https://github.com/piers-sinclair/cardpool) if you want to lift it for your own .NET CLI.

I still go back and forth on whether it was worth it. A `dotnet tool install -g` only reaches developers, and plenty of the people who actually use this don't write code, so Homebrew and winget are what make it reachable for everyone else. That's why I went with all three. For a tool this small it might be overkill, and I'm not sure I got the call right.
