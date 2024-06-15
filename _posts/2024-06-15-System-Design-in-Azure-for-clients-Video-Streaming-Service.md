---
layout: post
title:  "🧩 System Design in Azure for Clients - Video Streaming Service"
date:   2024-06-15 7:52:53 +1000
categories: system-design, azure, software-architecture, cloud-architecture, solution-architecture
author:
- Piers Sinclair
published: false
---

Welcome to my series on System Design in Azure, where I take you through designing a complex system on the Azure platform.

Generally, there are 3 steps I follow when a client asks me to architect a system for them.

1. Phase 1 - Requirements Gathering
2. Phase 2 - Technical Deep Dive
3. Phase 3 - Communicating the Sauce

Now let's take a look at an example where a client asks you to:

"Please build us a video streaming service similar to Youtube.com"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: So the system should let users load videos on the fly and allow real-time playback?\
A: Yes, it's crucial that the experience is seamless.

Q: For playing the videos, can the user jump to different points in time e.g. skip to 10 minutes in?\
A: Yes, it should support full control.

Q: Where are the videos located, do we need to support uploads?\
A: For now, it is just ~1000 videos located on our servers, our team uploads some new ones every now and then.

Q: Do we need to let external users upload?\
A: No, not at this stage. It's just for distributing our content to our clients.

Q: I assume we will want to be able to delete videos though?\
A: Oh yes for sure! And archive them too.

Q: Do we need to communicate any information to the user about the video e.g. a title? \
A: Yes, there is a whole bunch of metadata like upload date, title, number of views and more. There is no other media though, it's mostly text, dates, numbers etc.

Q: Do we need a commenting system?\
A: Nope, maybe later but not for now.

Q: How about authentication, do users need to like/dislike or provide custom input for videos?
A: No, they simply watch them for training.

Q: How about analytics?
A: No, our top priority is delivering our users a seamless experience.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Load and playback videos
- Video playback controls e.g. pause, play, skip ahead
- Upload videos
- Archive/Delete videos

Out of scope:
- External user upload
- Other media e.g. thumbnails
- Commenting
- Authentication
- Analytics

Before moving on, repeat back your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**. You might have noticed we already gleaned some information from the discussion around functional requirements. For example, we know that seamless playback is crucial and that the number of videos currently in the system is roughly 1000. There's no need to cover these points with further questions, but there's still other important points to go over.

Q: How often do users need to use the system?\
A: 24 hours, it's a globally used system so load is usually high at all hours. The system is used to train staff, so it would cause problems if people were blocked from viewing the videos.

Q: How big are the videos?\
A: Up to 4k.

Q: How many videos are we expecting to be watched everyday?\
A: We currently have 1 million users, but we expect that to reach 100 million in the next couple of years. We expect most users to view 1 or 2 videos a day.

Q: How often do we expect videos to be uploaded?\
A: Maybe once a week, and that is unlikely to increase.

Q: How about security, are there any major concerns?
A: Nope, all videos are publicly available.

Now repeat back your summary of the non-functional requirements:
- Low latency and high bandwidth - streaming is data intensive and we want to deliver a seamless user experience
- High availability - It's a global system and the videos are important for unblocking people
- Global delivery - We need to deliver content to all corners of the globe.
- Highly scalable - The user base is expected to rapidly increase, so scaling will be important.
- Usability - Users are going to want a seamless playback experience
- Storage - Needs to support video content in 4k, that's a very large volume
- Daily users created: expected to reach 100 million soon
- Daily videos watched: 100-200 million
- Uploads: Infrequent, once a week

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What API endpoints do we need to support?
2. How should we store the data?
3. How do we ensure videos load quickly?
4. How do we ensure seamless UX for users?

### 1. What API endpoints do we need to support?

```csharp
LoadVideo(videoId, videoQuality)
```

This LoadVideo endpoint should request the data for a video, and the details about that video.

```csharp
SetStart
```

The SetStart endpoint is important for reprioritizing the video load. Since videos are slow to load, we need to tell the server that the user wants to look at a different portion of the video.

Users will need the ability to play and pause a video but we can manage these events client side.

### 2. What data do we need to store?

- Video Metadata
- Video file (different sizes for different needs e.g. Low quality, high quality)

### Phase 3 - Communicating the Sauce

## References

