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

Q: How will the users find and view the videos?\
A: They will be on our public facing website. Users will be able to navigate to a page which has the video in it. There will also be a page for searching the videos.

Q: For playing the videos, can the user jump to different points in time e.g. skip to 10 minutes in?\
A: Yes, it should support full control.

Q: Where are the videos located, do we need to support uploads?\
A: For now, it is just ~1000 videos located on our servers, our team uploads some new ones every now and then.

Q: Do we need to let external users upload?\
A: No, not at this stage. It's just for distributing our content to our clients.

Q: And how do you want the videos uploaded, do we need a new website?\
A: I'm hoping we can add a new page to our existing internal web application, our users login to that everyday so it will be a convenient location.

Q: I assume we will want to be able to delete videos though?\
A: Oh yes for sure! And archive them too.

Q: Do we need to communicate any information to the user about the video e.g. a title? \
A: Yes, there is a whole bunch of metadata like upload date, title, number of views and more. There is no other media though, it's mostly text, dates, numbers etc.

Q: Do we need a commenting system?\
A: Nope, maybe later but not for now.

Q: Do users need to like/dislike or provide custom input for videos?\
A: No, they simply watch them for training.

Q: How about analytics?\
A: No, our top priority is delivering our users a seamless experience.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Load and playback videos
- Video playback controls e.g. pause, play, skip ahead
- Upload videos in .mp4 format
- Searching and displaying videos on the main website
- Archive/Delete videos

Out of scope:
- External user upload
- Upload videos in other file formats
- Other media e.g. thumbnails
- Commenting
- Authentication (it's handled by the existing app!)
- Analytics

Before moving on, repeat back your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**. You might have noticed we already gleaned some information from the discussion around functional requirements. For example, we know that seamless playback is crucial and that the number of videos currently in the system is roughly 1000. There's no need to cover these points with further questions, but there's still other important points to go over.

Q: How often do users need to use the system?\
A: 24 hours, it's a globally used system so load is usually high at all hours. The system is used to train staff, so it would cause problems if people were blocked from viewing the videos.

Q: How big are the videos?\
A: Up to 4k, usually about 5 mins long.

Q: How many videos are we expecting to be watched everyday?\
A: We currently have 10,000 users, but we expect that to reach 1 million in the next couple of years. We expect most users to view 1 or 2 videos a day.

Q: How often do we expect videos to be uploaded?\
A: Maybe once a week, and that is unlikely to increase.

Q: How about security, are there any major concerns?\
A: Nope, all videos are publicly available.

Q: Is it a big deal if we lose uploaded videos?\
A: Yes, this would be very problematic.

Now repeat back your summary of the non-functional requirements:
- Low latency and high bandwidth - streaming is data intensive and we want to deliver a seamless user experience
- High availability - It's a global system and the videos are important for unblocking people
- Global delivery - We need to deliver content to all corners of the globe.
- Highly scalable - The user base is expected to rapidly increase, so scaling will be important.
- Usability - Users are going to want a seamless playback experience
- Storage - Needs to support video content in 4k, that's a very large volume
- Reliable - It won't be acceptable to lose video data
- Daily users created: expected to reach 1 million soon
- Daily videos watched: 1-2 million
- Uploads: Infrequent, once a week
- Video Size: 4k, 5 min long

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What API endpoints do we need to support?
2. How should we store the data?
3. How do we ensure videos load quickly?
4. How do we ensure seamless UX for users?
5. How should we store thumbnail data?
6. How do we manage transcoding data?

### 1. What API endpoints do we need to support?

```csharp
UploadVideo(videoFile)
```

The UploadVideo endpoint will enable a video to be added to the system.

```csharp
SearchVideo(searchString)
```

The SearchVideo endpoint will allow users to search for a video to watch.

```csharp
LoadVideo(videoId, videoQuality)
```

The LoadVideo endpoint should request the data for a video, and the details about that video.

```csharp
SetStart(videoId, startTime)
```

The SetStart endpoint is important for reprioritizing the video load. Since videos are slow to load, we need to tell the server that the user wants to look at a different portion of the video.

Users will also need the ability to play and pause a video but we can manage these events client side.

### 2. What data do we need to store?

- Video Metadata
- Video file (different sizes for different needs e.g. Low quality, high quality)

Our video meta data is mostly text and since we don't need to support commenting or user data, it likely doesn't have many relationships.The consistency of this data is also not that important, if a user sees some slightly incorrect information it won't be a huge deal. So we can store this data in a NoSQL document database like [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)

However, this isn't the best solution for the video data because there is going to be a lot of data.

[Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-overview) is a safe bet because it is designed for storing this kind of data.

We also need to decide on a sharding strategy. Video ID is an easy default decision to make, since it is easy to understand, and is simple for upload and viewing of videos. However, it's worth noting that by sharding on Video ID our search functionality will be slower. Search would likely be a lot better in a relational database or using a different sharding strategy. Since scalability and performance of viewing and uploading videos is far more important, this is an acceptance trade-off.

![Storing a Short URL](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/1.png)\
**Figure: Basic architecture for video playback**

### 3. How do we ensure videos load quickly?

So we've got our basic infrastructure, but now we need to ensure videos always load quickly globally. There's a few things that can help:
- Transcoding Videos
- A CDN
- Separate App Servers for Upload, View and Search

### 3.1 Uploading - Transcoding

Important for putting the data into multiple formats e.g. 360p, 720p, 1080p, 2160p etc

Might need queues for this to loosely couple processing....might want a staging storage area followed by encoded followed by distribution to a CDN...at the end notify the meta data storage

### 3.2 CDN

A CDN can help improve load times for users by providing video data closer to their geographic location. We can replicate our video data out to locations in Europe, North America, Asia, Africa and more to ensure that users all over the globe can access videos quickly. 

The major trade-offs of this approach are cost and complexity. CDNs are notriously expensive. Let's do some quick estimates:

Keeping in mind the global delivery non-functional requirement let's assume we have relatively even traffic coming from the following locations:
- Europe
- North America
- Asia Pacific 
- South America
- Australia
- India

Let's assume a 4k Video at 5 min is roughly 2GB...and that the sum of all lower resolutions (2160p, 1080p etc) totals to roughly 2GB as well.

Let's assume clients generally watch videos in 4k.

Videos per month per location: ` 2 million video views / 6 = ~350k`

Data per month per location: ` 350k * 2GB = 700TB`

If we plug that into the [Azure Calculator that's 500k AUD](https://azure.com/e/99f062001f7348898130bf8895295b38), not cheap at all!

This cost is definitely something you need to call out with your client, unless this is crucial to their platform you will likely need to either adopt an alternative solution or look at various ways to optimize the cost. For our example we will assume the client absolutely needs this speed.

![Azure CDN Costs](/assets/images/2024-06-15-System-Design-in-Azure-for-clients-Video-Streaming-Service\azure-cdn-costs.png)\
**Figure: The 500k cost of Azure CDN!**

### 4. How do we ensure seamless UX for users?

Chunking - basically transfer the data bit by bit (call MediaKind API?)

Caching - basically store data for videos that are accessed super frequently

Detect slow networks

### 5. Archiving and deleting

Similar strategy as the URLs...but for deleting keep the meta data

### Phase 3 - Communicating the Sauce

## References

