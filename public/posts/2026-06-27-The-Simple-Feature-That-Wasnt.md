---
layout: post
title: 🧩 The Simple Feature That Wasn't, Splitting Text With No Delimiter
date:  2026-06-27 01:00:00 +1000
categories: dotnet
tags: dotnet, parsing, regex, heuristics, text-processing, design
author: Piers Sinclair
published: true
---

The ticket was one line: when I count the words in a card's effect, don't count the line that lists what you need to build the card. Count only the effect, and keep the rest in its own column.

I gave it an hour. It took most of a weekend, and the reason why is a decent lesson in when to stop reaching for a "proper" parser.

Some background, quickly. [cardpool](https://github.com/piers-sinclair/cardpool) is a CLI I built for a trading card game. It pulls in every card, looks at the effect text, and counts how many words that effect is. Some cards have a line at the top describing what you need to summon them, followed by the actual effect underneath. That top line isn't really "effect", so for the word count to mean anything I have to pull it off first.

### The version that works for an afternoon

Most of these cards store the material on its own line, with the effect on the next:

```
1 Tuner + 1 non-Tuner
Once per turn, you can draw 1 card.
```

So the first version is obvious. Split on the newline, keep everything after it:

```csharp
var text = "1 Tuner + 1 non-Tuner\nOnce per turn, you can draw 1 card.";
// -> "Once per turn, you can draw 1 card."
```

Ship it, move on. This handles a big chunk of the data and it's three lines of code.

Then I hit this:

```
2 Level 4 monsters Once per turn: You can detach 1 material from this card; draw 1 card.
```

No newline. The material and the effect are jammed onto one line with nothing between them. A person reads it instantly and knows the material is `2 Level 4 monsters` and the effect is the rest. A `Split('\n')` call has nothing to grab. There is no delimiter to split on, because the data was never written with one.

### There's no delimiter, but there is a pattern

Here's the thing I sat with for a while. There's no separator, but the two halves are written in recognisably different shapes.

The material half lists what you need. It almost always starts with a number (`2 Level 4 monsters`, `1 Tuner`), or a quoted name (`"Elemental HERO" monster`), or the word `Any`.

The effect half describes what the card does, and effect text starts with a small, stable set of opening words. `Once`. `If`. `When`. `Must`. `Activate`. `Target`. There aren't many, and they don't really change.

So I stopped looking for a separator and started looking for the first point where the text begins to read like an effect, and cut there. Two regexes carry it:

```csharp
[GeneratedRegex(@"^(?:\d|""[A-Z]|Any )")]
private static partial Regex MaterialStartRegex();

private const string EffectStartersPattern =
    @"Once|If|When|While|Unless|You|This card|Cannot|Must|During|At the|Each|" +
    @"Neither|Both players|Negate|Target|Gains|Draw|Banish|Send|Add|Return|" +
    @"Reveal|Excavate|Take|Place|Equip|Activate";

[GeneratedRegex(EffectStartersPattern)]
private static partial Regex EffectStarterRegex();
```

`MaterialStartRegex` answers one question: does this text even begin with something that looks like a material? `EffectStarterRegex` finds the point where the effect begins. The split is the gap between them:

```csharp
if (!MaterialStartRegex().IsMatch(text)) return new(null, text);

var match = EffectStarterRegex().Match(text);
if (!match.Success) return new(text, string.Empty);
if (match.Index == 0) return new(null, text);

return new(text[..match.Index].Trim(), text[match.Index..]);
```

### The interesting part is the cases where it's wrong

A heuristic is only as good as what it does when it guesses wrong, so most of the work went into the branches above, not the happy path. Every one of them has a defined, non-destructive answer.

**If there's a newline, trust it.** The heuristic only runs when there isn't one. Don't get clever with text that already told you where to cut.

**If the text doesn't start like a material, it's all effect.** `Once per turn: Draw 1 card.` has no material line, so it comes back untouched. No leading number, no quote, no `Any`, no split.

**If an effect-starter sits at the very start, it's all effect.** Index zero means there was never a material in front of it.

**If there's no effect-starter anywhere, it's all material.** This is the case I would never have guessed up front. Some cards are nothing but a list of named pieces with no effect text at all:

```
"Fairy Dragon" + "Amazon of the Seas" + "Zone Eater"
2+ monsters, including a Link Monster
```

Those correctly strip to an empty effect and count as zero words, which is exactly right. They have no effect to count.

**And only run any of this on cards that can have materials in the first place.** A whole class of cards never has a material line, so the code checks the card type and returns immediately for the rest. Domain knowledge is the cheapest filter you have. Use it to shrink the problem before you write a single regex.

The safety net under all of it: the original full text is preserved elsewhere, and the strip only affects the word count and one separate column. So the worst case of a bad split is a word count that's off by a few, not lost data. That bounded, recoverable cost is the whole reason a heuristic is the right call here.

### When the heuristic is the right answer

I could have written a "real" parser. I'm glad I didn't, and the reason is that there is no grammar to parse. This is decades of human-written text with no schema, edited by many hands, full of one-off phrasings. A formal parser for it would be huge, brittle, and still wrong on the long tail. The targeted heuristic is a couple of dozen lines, it's easy to read, and when it misses a case I paste the real card text into a test and nudge one regex:

```csharp
[Fact]
public void StripMaterialLine_SingleLineXyz_RemovesMaterial()
{
    var text = "2 Level 4 monsters Once per turn: You can detach 1 material from this card; draw 1 card.";
    MaterialStripper.StripMaterialLine(text).ShouldStartWith("Once");
}
```

The whole thing is pinned by tests built from actual strings, so I can tighten it without fear of breaking the cases that already work.

So here's where I land. Reach for a heuristic when the input is irregular, there's no real grammar, and a wrong answer is cheap and recoverable. Reach for a parser when the structure is genuine and a wrong answer is expensive. The mistakes are symmetrical: using a fuzzy heuristic where you actually needed a parser, and building a parser where twenty lines of pattern matching would have done the job and been easier to maintain.

The hard part of this feature was never the code. It was noticing that "split the material off the effect" was a recognition problem wearing a string-manipulation costume.

Where do you draw your line between a heuristic and a parser? I'm curious whether yours sits in a different place to mine.
