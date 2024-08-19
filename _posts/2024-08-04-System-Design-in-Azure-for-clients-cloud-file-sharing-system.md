---
layout: post
title:  "🧩 System Design in Azure for Clients - Cloud File Sharing System"
date:   2024-08-04 01:00:00 +1000
categories: system-design
tags: system-design, azure, software-architecture, cloud-architecture, solution-architecture
author:
- Piers Sinclair
published: false
---

Welcome to my series on system design in Azure, where I take you through designing a complex system on the Azure platform.

Generally, there are 3 steps I follow when a client asks me to architect a system for them.

1. Phase 1 - Requirements Gathering
2. Phase 2 - Technical Deep Dive
3. Phase 3 - Communicating the Sauce

Now let's take a look at an example where a client asks you to:

"Please build us a cloud file sharing system similar to [OneDrive](https://www.microsoft.com/en-au/microsoft-365/onedrive)"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: Is this a brand new app or integrating with an existing app?\
A: It's brand new.

Q: Who will use the app?\
A: It will be a global app available freely to anyone.

Q: What document types do we need to store?\
A: Text files, Word Documents, Images, Videos...anything the user wants really.

Q: Do we need to share documents between users?\
A: Yes.

Q: Will we need permissions for the sharing?\
A: Yes, users should be able to share as read-only or as edit.

Q: Do we need to support real-time editing of documents between multiple users?
A: No, let's keep it simple for now, 2 users can edit a document but not at the same time.

Q: What device types will access the files?\
A: It should be available from phones, tablets and PCs.

Q: Do users need access while offline?\
A: Yes.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Store files of any type
- Share files including permissions
- Files accessible on phones, tablets and PCs
- Files accessible while offline
- Files accessible globally

Out of scope:
- Real-time document editing

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: What is the pricing model?\
A: Users will get 1GB of free data and then they will be charged per GB of extra storage.

Q: Will there be a limit on the size of a file?\
A: No, as long as they are willing to pay, we will store it.

Q: Do users need access to their files 24/7?\
A: Yes, they will want to get to their data whenever they want.

Q: I assume users will not tolerate data loss?\
A: Correct, it would cause serious problems.

Q: Since users will be editing the same files frequently, it will be important for them to see a consistent status of the files so they don't get confused. Do you agree?\
A: Yes, sounds logical.

Q: How important is security?\
A: It will be important, our users are going to expect that their documents are safe from others.

Q: How many users do you expect to have?\
A: I expect it to grow to over 50 million in the first few years.

Q: How much data do you expect users to store on average?\
A: Maybe 5GB

Q: How often on average is the system used by users?\
A: Daily

Q: How many files do they usually edit per day?\
A: 1-2

Q: Do you expect read and writes to be a similar amount?\
A: Yes

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **Reliable:** The users must trust that data will not be lost.
- **Consistency:** The state of data should always be communicated consistently to users to avoid confusing behaviour.
- **Secure:** The system should feel real-time.
- **Available:** The users should trust that they can get to their files and changes when they want to.
- **Users:** 50 million
- **Data per user:** 5GB
- **Read/Write Ratio:** 1:1

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What APIs are we going to need?
2. What's the base level architecture? 
3. How do we store data so that it is both available and consistent?
4. How do we avoid data loss?
5. How do we manage the syncing process?
6. How are we going to handle conflicting versions of a document?
7. How do we ensure smooth UX when bandwidth is low?
8. How much is this going to cost?
9. What security measures do we need in place?
10. How do we enable sharing of data with permissions?

### 1. What APIs are we going to need?

We will need to support a fair few APIs to get the base functionality. Consider the actions you might want in a file system.

Here's a preliminary list but there's probably lots more ways to extend in the future:
- `Open`: Open's a file on your machine.
- `Save`: When a file is created or updated it should be saved.
- `Delete`: When a file is flagged for removal.
- `View Version History`: See past versions of the file.
- `Search`: Search file names (later we could support content or other meta data).
- `View Recent`: See a list of documents that have been recently viewed or edited.
- `Download Copy`: Get a copy of the file locally on the user's device.
- `Share`: Share the file with another person so they can view or edit it.

### 2. What's the base level architecture? 

Let's start with a simple architecture. We'll have devices of many types (e.g. mobile, tablet, PC).

We'll need an API for communicating with data storage and that can go in an [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/)

We'll need a nice way to store blob files like [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction)

Finally we'll need a load balancer like [Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) to manage traffic to the API.

### 3. How do we store data so that it is both available and consistent?

For our system availability is going to be important because users will want access to their documents at any time.

On the other hand, consistency is important because if there are updates to a file, the users need to be notified of that ASAP so they do not end up with conflicts.

According to [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem) a distributed system can only achieve two out of the three guarantees: Consistency, Availability, and Partition Tolerance. Partition Tolerance is essential in distributed systems, meaning we must balance between Consistency and Availability.

To address the need for both high availability and consistency, we employ multiple databases.

We can store our file data in Azure Blob Storage which aims for a balance of high availability and consistency in most situations. It achieves this balance by [adopting a strong consistency model for reads after a write operation](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage) and [ensuring availability through storage redundancy across different regions](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy). However, Azure Blob Storage doesn't store all the meta data we need for our files, and it doesn't guarantee ACID compliance because it only offers consistency and durability.

For the meta data consistency is key because the user's should always know the state of a file, so we will use an [Azure SQL database](https://learn.microsoft.com/en-us/azure/azure-sql/database/?view=azuresql) to ensure ACID compliance.

We also need to shard our file data in both Azure Blob Storage and Azure SQL. Sharding by user makes sense since we usually access the files for a specific user.

### 4. How do we avoid data loss?

Data loss is a significant issue for a cloud file sharing system. Customers will expect that their data is backed up regardless of circumstances. Data loss is often viewed as one of the worst things that can happen to a system

Due to this expectation we need a strategy for managing data loss of both files and meta data.

For Azure Blobs there are [several redundancy options](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy) but for this system [geo-redundant storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy#redundancy-in-a-secondary-region) makes sense because it lets us create a copy of our files in another region to protect against any possible regional problems.

Azure SQL is similar providing the [geo-replication option](https://learn.microsoft.com/en-us/azure/azure-sql/database/active-geo-replication-overview?view=azuresql) to duplicate the database in another region.

### 5. How do we manage the syncing process?

When users make changes to files, it is important that they are communicated quickly to other users because it will affect what other users are doing. 

So we need a notification system, and a way for users to be made aware of changes. There are 2 flows we need to consider, receiving updates and triggering updates

#### Receiving Updates
Notifications will need to happen in real-time. Two options are [Long Polling](https://www.enjoyalgorithms.com/blog/long-polling-in-system-design0) or [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

Both are valid. WebSocket can be better for more fluid real-time connection and better management of server load. However, we will go with Long polling because it is simpler to implement and maintain. We can always switch to WebSocket later as our user base increases and server load becomes a clear issue.

So when a user opens their client device it will initiate a long polling connection with the server. Then, when a user calls the `Save()` or `Delete()` API this will trigger all of the open long poll requests to return and then reinitiate a new long poll request.

### 6. How are we going to handle conflicting versions of a document?

When users make changes to a file, it's possible that someone has already triggered an update to that file. In that case, the 2 versions will be conflicting. There are a few options we could adopt to manage this:

- Have the latest version always overwrite but this would cause users to lose their changes, so it's probably not as great option.
- Save a copy of the conflicting file. By appending an incrementing number to the end of the file name it ensures the files never conflict. The downside is that user's won't necessarily be aware of the new copy and may have to clean up their files later.
- Prompt to say there is a newer version and ask what to do. This approach is probably the gold standard in terms of User Experience, however it adds a lot of extra complexity to the code.

In this case, saving a copy is a nice solution because it's simple and easier to implement. We can improve upon the system later with the prompt once other more important issues are addressed or the users flag it as a significant concern.

### 7. How do we ensure smooth UX when bandwidth is low?

Users will have different bandwidth requirements depending on connection speed.

To ensure smooth connection we will need to chunk the data. Luckily, [Azure Blobs support this out-of-the-box](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block?tabs=microsoft-entra-id) so it's simple to implement

Chunking our transfers gives a number of benefits:
- Better resiliency to network outages because data is transferred in small portions
- Lower amount of data transferred because only a small piece of data which has been modified is sent up.
- Reduced size of data stored in the cloud because duplicate blocks can be stored only once.

Moreover, different device types will have different storage space requirements. For example, a mobile usually has far less storage capacity than a desktop PC.

For this reason, we want to ensure we only store data when a user requests a file on their device. In the meta data we can store which devices it has been copied to so we know where to update it when changes occur..

### 8. How much is this going to cost?

We are going to be storing mass amounts of data, so cloud storage could get expensive. It's worth doing some quick calculations with the Azure calculator to get an idea:

#### Blob Storage Amount

##### Flat Storage
50 million users * 5GB = 250 million GB
250 million GB / 1,000 = 250 thousand TB

##### Reads/Writes

We know that the users are using the system everyday and they are editing 1-2 files. Let's assume each time they touch a file they modify 4 blocks.

Let's average out 1-2 files to 1.5 files.

So a rough calculation for reads would be:

1.5 files * 4 blocks * 50 million = 300 million reads per day

300 million * 30 = 9 billion

We know reads and writes have a similar ratio so we assume a similar number of writes.

For the amount of data we can assume 50 KB per block.

9 billion * 50 KB / 1,000,000 = 450 GB

##### Data Summary

- **Flat Storage:** 250 thousand TB
- **Reads per month:** 9 billion
- **Writes per month:** 9 billion
- **Data transferred per month:** 450 GB

#### Azure Calculator

An initial estimate gives us [$17 million AUD](https://azure.com/e/20b7869d8e314a4d9565bd39308e8e8b)

![That's a hefty bill!](/assets/images/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/big-azure-costs.png)
**Figure: That's a hefty bill!**

We can see most of that cost comes from the storage of the data. There are a few things we should do to minimize this cost:

1. Avoid data duplication. When a block is uploaded we should check if it already exists and if it does then avoid storing it twice.
2. Archive unused data. Wherever possible we should move unused data to a cold or archived tier.

##### Data Archiving

For data archiving Azure Blobs offer 4 tiers, Hot, Cool, Cold and Archive tier.

We can use [data life cycle management](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview) to automatically cycle our files to different tiers when they haven't been accessed for a specified time. For example, we could transfer files to the cool tier after 30 days of no modification and to the archive tier 90 days after modification.

Assuming the above policy let's recalculate our Azure costs using the following rough estimates:

Hot Tier: 450 GB (last month of data)
Cool Tier: 900 GB (last 3 months of data - Hot Tier amount)
Archive Tier: 249,000 TB (250,000 TB - Hot and Cool Tier)

**Hot Tier Reads:** 9 billion
**Hot Tier Writes:** 9 billion

**Cool Tier Reads:** < 10 thousand (significantly reduced as the files haven't been accessed in > 30 days)
**Cool Tier Writes:** 9 billion (same amount of data transferred as hot)

**Hot Tier Reads:** < 10 thousand (significantly reduced as the files haven't been accessed in > 30 days)
**Hot Tier Writes:** 9 billion (same amount of data transferred as hot)

[New calculation -> $2 million AUD](https://azure.com/e/eeca9192e563492980529a90dce8a0ed)

![A more manageable Azure bill](/assets/images/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/big-azure-costs.png)
**Figure: A more manageable Azure bill**

That's a huge reduction of price! Still expensive but at least manageable now. 

Clearly costs can vary wildly depending on how we optimize the system. For this reason you would want to do a more detailed deep dive into cost before the real implementation.

### 9. What security measures do we need in place?

Data Encryption

### 10. How do we enable sharing of data with permissions?

- Auth
- RBAC

### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits
- {{ XXX }}

#### Deficiencies
- {{ XXX }}

🎉 Congratulations - you've got a happy and informed client.

## References

- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
- [DesignGurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b63ac93e7ae59a1afd1)
- [System Design School](https://systemdesignschool.io/problems/dropbox/solution)