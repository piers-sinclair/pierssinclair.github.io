---
layout: post
title:  "🧩 System Design in Azure for Clients - Video Streaming Service"
date:   2024-06-23 15:00:00 +1000
categories: system-design, azure, software-architecture, cloud-architecture, solution-architecture
author:
- Piers Sinclair
published: true
---

Welcome to my series on system design in Azure, where I take you through designing a complex system on the Azure platform.

Generally, there are 3 steps I follow when a client asks me to architect a system for them.

1. Phase 1 - Requirements Gathering
2. Phase 2 - Technical Deep Dive
3. Phase 3 - Communicating the Sauce

Now let's take a look at an example where a client asks you to:

"Please build us a video streaming service similar to [YouTube](https://www.youtube.com)"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: So the system should let users load videos on the fly and allow real-time playback?\
A: Yes, the experience must be seamless.

Q: How will the users find and view the videos?\
A: They will be on our public-facing website. Users will be able to navigate to a page that has the video in it. There will also be a page where you can search for videos.

Q: For playing the videos, can the user jump to different points in time (e.g. skip to 10 minutes in)?\
A: Yes, it should support complete control.

Q: Where are the videos located?\
A: For now, just ~1000 videos are located on our servers.

Q:  Do we need to support uploads?\
A: our team uploads some new ones now and then.

Q: Do we need to let external users upload?\
A: No, not at this stage. It's just for distributing our content to our clients.

Q: And how do you want the videos uploaded? Do we need a new website?\
We want to add a new page to our internal web application. Our users login to that every day so that it will be a convenient location.

Q: I assume we will want to be able to delete videos though?\
A: Oh yes, for sure! And archive them.

Q: Do we need to communicate any information to the user about the video (e.g. a title)? \
A: Yes, there is a whole bunch of metadata like upload date, title, number of views and more. However, the only other media is thumbnails. The rest of the data is mostly text, dates, numbers, etc.

Q: Do we need a commenting system?\
A: Nope, maybe later, but not for now.

Q: Do users need to like/dislike or provide custom video input?\
A: No, they watch them for training.

Q: How about analytics?\
A: No, our top priority is delivering a seamless user experience.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Load and playback videos
- Video playback controls (e.g. pause, play, skip ahead)
- Upload videos in .mp4 format
- Store video metadata, including thumbnails
- Searching and displaying videos on the main website
- Archive/Delete videos

Out of scope:
- External user upload
- Upload videos in other file formats
- Other media that isn't a video or thumbnail
- Commenting
- Authentication (the existing app handles it!)
- Analytics

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**. You might have noticed that we have already gleaned some information from the discussion about functional requirements. For example, we know that seamless playback is crucial and that the number of videos currently in the system is roughly 1000. We don't need to revisit these points, but there are other important points to cover.

Q: How often do users need to use the system?\
A: 24 hours. It's a globally used system, so the load is usually high at all hours. The system is used to train staff, so it would cause problems if people could not view the videos.

Q: How big are the videos?\
A: Up to 4k, usually about 5 mins long.

Q: How many videos are we expecting to be watched every day?\
A: We currently have 10,000 users, but we expect that to reach 1 million in the next few years. We expect most users to view 1 or 2 videos a day.

Q: How often do we expect videos to be uploaded?\
A: Maybe once a week, and that is unlikely to increase.

Q: How about security? Are there any significant concerns?\
A: Nope, all videos are publicly available.

Q: Is it a big deal if we lose uploaded videos?\
A: Yes, this would be very problematic.

Now repeat back your summary of the non-functional requirements:
- Low latency and high bandwidth - streaming is data intensive, and we want to deliver a seamless user experience
- High availability - It's a global system, and the videos are important for unblocking people
- Global delivery - We must deliver content to all corners of the globe.
- Highly scalable - The user base is expected to increase rapidly. Thus, scaling will be important.
- Usability - Users are going to want a seamless playback experience
- Storage - Needs to support video content in 4k, which is a huge volume
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
6. How do we manage archive and delete?

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

The LoadVideo endpoint should request the data for a video and the details about that video.

```csharp
SetStart(videoId, startTime)
```

The SetStart endpoint is essential for reprioritising the video load. Since videos are slow to load, we must tell the server that the user wants to look at a different portion of the video.

Users will also need the ability to play and pause a video, but we can manage these events on the client side.

### 2. What data do we need to store?

- Video Metadata
- Video files - different sizes for different needs (e.g. Low quality, high quality)

Our video metadata is mainly text. Since we don't need to support commenting or user data, it likely has few relationships. The consistency of this data is also not that important. It will be fine if a user sees some slightly incorrect information. So we can store this data in a NoSQL document database like [Azure Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/)

However, there are better solutions for video data because there will be lots of data.

[Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-overview) is a safe bet because it is designed for storing this kind of data.

We also need to decide on a sharding strategy. Video ID is an easy default decision since it is easy to understand and simple to upload and view videos. However, it's worth noting that by sharding on Video ID, our search functionality will be slower. Search would be better in a relational database or using a different sharding strategy. This trade-off is acceptable since the scalability and performance of viewing and uploading videos are far more critical.

![Basic architecture for video playback](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/1.png)\
**Figure: Basic architecture for video playback**

### 3. How do we ensure videos load quickly?

So we've got our basic infrastructure, but now we must ensure videos always load quickly globally. There are a few things that can help:
- Separate App Servers for Upload, View and Search
- Transcoding Videos
- A CDN

### 3.1 Separate App Servers for Upload, View and Search

Uploading is a significantly more demanding task than viewing and searching. We don't want users to be blocked from watching videos because someone is currently uploading a video.

Similarly, viewing is a more demanding task than searching. Both view and search are likely to have a massive volume of requests. We wouldn't want searching to be slowed by requests for video streams and vice versa. 

It's better if we modularise these services into different app servers.

![Split App Servers for better load balancing](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/2.png)\
**Figure: Split App Servers for better load balancing**

### 3.2 Uploading - Transcoding

When we upload, it will be essential to store the data in multiple formats (e.g. 360p, 720p, 1080p, 2160p etc.)

We need all these formats to ensure users receive a lower-quality format when their network speed cannot support a higher-quality one.

So, we need a way to transcode the video data. When the user uploads their file, we must store the original data in Blob storage to always have a copy. Our upload server can then transcode this file into other formats and do the following:
- Store it in a transcoded storage area.
- Update the metadata

![Transcoding first stores in original storage, then in transcoded storage](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/3.png)\
**Figure: Transcoding first stores in original storage, then in transcoded storage**

We aren't likely to have a heavy load here because the expected upload frequency is once a week, so we don't need to worry as much about designing for scalability. However, this is an important point to call out to the client in case they might have different expectations in the future. For example, a service on the scale of YouTube would have far more things to manage in their upload server because they need to deal with a massive volume of uploads. For that scale, you might use message queues to loosely couple different servers and modularise and parallelise different upload tasks.

### 3.3 CDN

A CDN (e.g. [Azure CDN](https://azure.microsoft.com/en-us/products/cdn), [Akamai CDN](https://www.akamai.com/solutions/content-delivery-network)) can help improve load times for users by providing video data closer to their geographic location. We can replicate our video data in Europe, North America, Asia, Africa, and more to ensure that users all over the globe can access videos quickly.

![Architecture incorporating a CDN serving content quickly and globally](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/4.png)\
**Figure: Architecture incorporating a CDN serving content quickly and globally**

The significant trade-offs of this approach are cost and complexity. CDNs are notoriously expensive. Let's do some quick estimates:

Keeping in mind the global delivery non-functional requirement, let's assume we have relatively even traffic coming from the following locations:
- Europe
- North America
- Asia Pacific 
- South America
- Australia
- India

Let's assume a 4k Video at 5 min is roughly 2GB...and that the sum of all lower resolutions (2160p, 1080p, etc.) also totals to roughly 2GB.

Let's assume clients generally watch videos in 4k.

Videos per month per location: ` 2 million video views / 6 = ~350k`

Data per month per location: ` 350k * 2GB = 700TB`

If we plug that data into the [Azure Calculator that's ~500k AUD per month](https://azure.com/e/99f062001f7348898130bf8895295b38), not cheap at all!

You need to call out this cost with your client. Unless this is crucial to their platform, you will likely need to adopt an alternative solution or look at various ways to optimise the cost. For our example, we assume the client needs this speed for all their videos.

![Azure CDN Costs](/assets/images/2024-06-15-System-Design-in-Azure-for-clients-Video-Streaming-Service\azure-cdn-costs.png)\
**Figure: The 500k cost of Azure CDN!**

### 4. How do we ensure seamless UX for users?

Users who watch video files won't want to wait for the whole video to load before they start watching. Chunking is the way to solve this, and it involves transferring data bit-by-bit rather than all at once. [Azure CDN supports chunking out-of-the-box](https://learn.microsoft.com/en-us/azure/cdn/cdn-large-file-optimization?toc=%2Fazure%2Ffrontdoor%2FTOC.json#object-chunking) so lucky for us we don't need to worry about implementing it.

On the client side, we need to detect a slow network user and serve them lower-quality content. Adaptive bitrate streaming is the way to accomplish this, and many media players support it out-of-the-box, e.g. [Video.js](https://videojs.com/)

Remember how we had a View API and `LoadVideo` and `SetStart` endpoint for viewing videos?

We no longer need those since we are doing everything on the client side. This change will simplify our architecture and ensure that videos are loaded quickly and according to client network speed. Some downsides are that the client side will be more complex, and if we have multiple clients (e.g. a mobile app), we may need to implement the logic numerous times.

We will still need to retrieve video metadata when we load it. We can incorporate this as an endpoint `GetVideoMetadata(videoId)` in our Search API and rename it to Video Metadata API.

![Architecture that queries the CDN client-side](/assets/diagrams/2024-06-15-System-Design-in-Azure-for-Clients-Video-Streaming-Service/5.png)\
**Figure: Architecture that queries the CDN client-side**

### 5. How should we store thumbnail data?
Thumbnails also need to be processed when we upload. Given the limited number of uploads, it's acceptable for the upload server to process and store these alongside the transcoded videos.

### 6. Archiving and deleting
There are a few considerations when a user wants to archive a video.

First, we want to keep the metadata and the original video in case we need to restore it. However, we don't need to keep the transcoded data or the data in the CDN because we can restore this later.

So, an archive request should set a flag in the metadata and delete all transcoded data. We can add 2 endpoints to the `Upload API` and rename it to `Video Management API`:
```csharp
Archive Video(videoId)
```

```csharp
RestoreVideo(videoId)
```

Delete is even simpler. We purge all data using yet another endpoint:

```csharp
DeleteVideo(videoId)
```

### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits
- Streaming Scalability - Video streaming is designed to scale to millions of users and views.
- Globally Available - Videos are designed to be delivered globally and quickly.
- Seamless UX - Video playback is built to deliver content in chunks, and the quality is optimised based on user network connection.
- Reliable - We have robust mechanisms to ensure data is safe, such as storing a copy of the original videos.
- High-Quality Videos - The system delivers and stores videos up to 4k, which is lots of data

#### Deficiencies
- Maintenance - It's a highly complex solution requiring lots of maintenance.
- Expensive - There are a lot of 3rd party cloud services here, and Azure CDN, in particular, is going to cost a pretty penny.
- Uploading Scalability - Upload may not scale well because we have designed it to suit the limited load outlined by the client
- Search Scalability - Search could get slow because we are sharding on VideoId. However, given the low number of videos and the importance of streaming, this is an acceptable trade-off
- Client-Side Complexity - Handling video streaming on the client-side makes the frontend code more complex and could introduce duplication for different platforms.

🎉 Congratulations - you've got a happy and informed client.

## References

- [Design Gurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b68ac93e7ae59a1b009)
- [Geeks for Geeks Article](https://www.geeksforgeeks.org/system-design-of-youtube-a-complete-architecture/ )
- [System Design Prep Course](https://systemdesignprep.com/youtube)
- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF0)
- [ByteByteGo Website](https://bytebytego.com/courses/system-design-interview/design-youtube)
- [Enjoy Algorithms Blog](https://www.enjoyalgorithms.com/blog/design-youtube-system-design-interview-question)