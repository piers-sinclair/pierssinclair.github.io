---
layout: post
title:  🧩 System Design in Azure for Clients - Cloud File Sharing System
date:   2024-08-24 01:00:00 +1000
categories: system-design
tags: system-design, azure, software-architecture, cloud-architecture, solution-architecture
author:
- Piers Sinclair
published: true
---

Welcome to my series on system design in Azure, where I take you through designing a complex system on the Azure platform.

Generally, there are three steps I follow when a client asks me to architect a system for them.

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
A: It will be a global app that is available freely to anyone.

Q: What document types do we need to store?\
A: Text files, Word documents, images, videos, or anything the user wants.

Q: Do we need to share documents between users?\
A: Yes.

Q: Will we need permissions for sharing files?\
A: Users should be able to share as read-only or edit.

Q: Do we need to support real-time editing of documents between multiple users?\
A: Let's keep it simple for now; two users can edit a document, but not simultaneously.

Q: What device types will access the files?\
A: It should be available on phones, tablets and PCs.

Q: Do users need access while offline?\
A: Yes.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Store files of any type
- Share files, including permissions
- Files accessible on phones, tablets and PCs
- Files accessible while offline
- Files accessible globally

Out of scope:
- Real-time document editing

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: What is the pricing model?\
A: Users will get 1GB of free data and then be charged per GB of extra storage.

Q: Will there be a limit on the size of a file?\
A: No, as long as they are willing to pay, we will store it.

Q: Do users need access to their files 24/7?\
A: They will want to get to their data whenever they want.

Q: I assume users will not tolerate data loss?\
A: Correct, it would cause serious problems.

Q: Since users will be editing the same files frequently, it will be important to receive updates about the status of files so they don't get confused. Do you agree?\
A: Yes, that sounds logical.

Q: How important is security?\
A: It will be crucial. Our users are going to expect that their documents are safe from others.

Q: How many users do you expect to have?\
A: I expect it to grow to over 50 million in the first few years.

Q: How much data do you expect users to store on average?\
A: Maybe 5GB

Q: How often, on average, do users use the system?\
A: Daily

Q: How many files do they usually edit per day?\
A: 1-2

Q: Do you expect reads and writes to be a similar amount?\
A: Yes

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **Reliable:** The users must trust that data will not be lost.
- **Consistency:** The state of data should always be communicated consistently to users to avoid confusing behaviour.
- **Secure:** Users should have confidence that third parties won't intercept their data.
- **Available:** The users should trust that they can get to their files and changes when they want to.
- **Users:** 50 million
- **Data per user:** 5GB
- **Read/Write Ratio:** 1:1

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What APIs are we going to need?
2. What's the base-level architecture? 
3. How do we store data to be both available and consistent?
4. How do we avoid data loss?
5. How do we manage the syncing process?
6. How are we going to handle conflicting versions of a document?
7. How do we ensure smooth UX when bandwidth is low?
8. How much is this going to cost?
9. What security measures do we need in place?
10. How do we enable the sharing of data with permissions?

### 1. What APIs are we going to need?

We must support a fair few APIs to get the right base functionality. Consider the actions you might want in a file system.

Here's a preliminary list, but there are probably lots more ways to extend it in the future:
- `Open`: Open a file on your machine.
- `Save`: A file should be saved when created or updated.
- `Delete`: When a file is flagged for removal.
- `View Version History`: See past versions of the file.
- `Search`: Search file names (later, we could support content or other metadata).
- `View Recent`: See a list of documents that have been recently viewed or edited.
- `Download Copy`: Get a copy of the file locally on the user's device.
- `Share`: Share the file with another person so they can view or edit it.

### 2. What's the base-level architecture? 

Let's start with a simple architecture. We'll have devices of many types (e.g. mobile, tablet, PC).

We'll need an API for communicating with data storage, and that can go in an [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/)

We'll need a nice way to store blob files like [Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction)

Finally, we'll need a load balancer like [Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) to manage traffic to the API.

![The basic architecture for our file-sharing system](/assets/diagrams/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/1.png)\
**Figure: The basic architecture for our file-sharing system**

### 3. How do we store data to be both available and consistent?

Our system's availability will be critical because users will want access to their documents anytime.

On the other hand, consistency is important because if there are updates to a file, the users must be notified ASAP to avoid conflicts.

According to [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem), a distributed system can only achieve two out of the three guarantees: Consistency, Availability, and Partition Tolerance. Partition tolerance is essential in distributed systems, meaning we must choose between consistency and availability.

We employ multiple databases to address the need for both high availability and consistency.

We can store our file data in Azure Blob Storage, which aims to balance high availability and consistency in most situations. It achieves this balance by [adopting a strong consistency model for reads after a write operation](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage) and [ensuring availability through storage redundancy across different regions](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy). However, Azure Blob Storage doesn't store all the metadata we need for our files, and it doesn't guarantee ACID compliance because it only offers consistency and durability.

For the metadata, consistency is vital because the users should always know the state of a file, so we will use an [Azure SQL database](https://learn.microsoft.com/en-us/azure/azure-sql/database/?view=azuresql) to ensure ACID compliance.

We must also shard our file data in Azure Blob Storage and Azure SQL. Sharding by user makes sense since we usually access the files for a specific user.

![The architecture after we add a metadata database](/assets/diagrams/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/2.png)\
**Figure: The architecture after we add a metadata database**

### 4. How do we avoid data loss?

Data loss is a significant issue for a cloud file-sharing system. Customers will expect that their data is backed up regardless of circumstances. Data loss is often viewed as one of the worst things to happen to a system.

Due to this expectation, we need a strategy for managing data loss of both files and metadata.

For Azure Blobs, there are [several redundancy options](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy), but for this system [geo-redundant storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy#redundancy-in-a-secondary-region) makes sense because it lets us create a copy of our files in another region to protect against any possible regional problems.

Azure SQL is similar providing the [geo-replication option](https://learn.microsoft.com/en-us/azure/azure-sql/database/active-geo-replication-overview?view=azuresql) to duplicate the database in another region.

### 5. How do we manage the syncing process?

When users make changes to files, they must be communicated quickly to other users because it will affect what other users are doing. 

So we need a notification system and a way for users to be aware of changes. We need to consider two flows: receiving updates and triggering updates.

#### Receiving Updates
Notifications will need to happen in real time. Two options are [Long Polling](https://www.enjoyalgorithms.com/blog/long-polling-in-system-design0) or [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).

Both are valid. WebSocket can be better for more fluid real-time connection and better server load management. However, we will go with Long polling because it is simpler to implement and maintain. We can always switch to WebSocket later as our user base increases and server load becomes a clear issue.

So when a user opens their client device, a long polling connection with the server will be initiated. Then, when a user calls the `Save()` or `Delete()` API this will trigger all of the open long poll requests to return and then reinitiate a new long poll request.

### 6. How are we going to handle conflicting versions of a document?

When users make changes to a file, it's possible that someone has already triggered an update to that file. In that case, the two versions will be conflicting. There are a few options we could adopt to manage this:

- Have the latest version always overwrite, but this would cause users to lose their changes, so it's not a great option.
- Save a copy of the conflicting file. Appending an incrementing number to the end of the file name ensures the files never conflict. The downside is that users won't necessarily be aware of the new copy and may have to clean up their files later.
- Prompt to say there is a newer version and ask what to do. This approach is the gold standard in terms of User Experience. However, it adds a lot of extra complexity to the code.

In this case, saving a copy is a nice solution because it's simple and easier to implement. We can improve the system later with the prompt once other more important issues are addressed or the users flag it as a significant concern.

### 7. How do we ensure smooth UX when bandwidth is low?

Users will have different bandwidth requirements depending on connection speed.

To ensure a smooth connection, we will need to chunk the data. Luckily, [Azure Blobs support this out-of-the-box](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block?tabs=microsoft-entra-id) so it's simple to implement

Chunking our transfers gives a number of benefits:
- Better resiliency to network outages because data is transferred in small portions
- A lower amount of data is transferred because only a small piece of data that has been modified is sent up.
- Reduced data size stored in the cloud because duplicate blocks can be stored only once.

Moreover, different device types will have different storage space requirements. For example, a mobile usually has far less storage capacity than a desktop PC.

For this reason, we want to ensure we only store data when a user requests a file on their device. In the metadata, we can store which devices it has been copied to so we know where to update it when changes occur.

### 8. How much is this going to cost?

We will be storing mass amounts of data, so cloud storage could get expensive. It's worth doing some quick calculations with the Azure calculator to get an idea:

#### Blob Storage Amount

##### Flat Storage
50 million users * 5GB = 250 million GB
250 million GB / 1,000 = 250 thousand TB

##### Reads/Writes

Users use the system daily to edit 1-2 files. Let's assume each time they touch a file, they modify four blocks.

Let's average out 1-2 files to 1.5 files.

So a rough calculation for reads would be:

1.5 files * 4 blocks * 50 million = 300 million reads per day

300 million * 30 = 9 billion

We know reads and writes have a similar ratio, so we assume a similar number of writes.

For the amount of data, we can assume 50 KB per block.

9 billion * 50 KB / 1,000,000 = 450 GB

##### Data Summary

- **Flat Storage:** 250 thousand TB
- **Reads per month:** 9 billion
- **Writes per month:** 9 billion
- **Data transferred per month:** 450 GB

#### Azure Calculator

An initial estimate gives us [$17 million AUD per month](https://azure.com/e/20b7869d8e314a4d9565bd39308e8e8b)

![That's a hefty bill!](/assets/images/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/big-azure-costs.png)
**Figure: That's a hefty bill!**

We can see that most of that cost comes from data storage. There are a few things we should do to minimize this cost:

1. Avoid data duplication. When a block is uploaded, we should check if it already exists, and if it does, then avoid storing it twice.
2. Archive unused data. We should move unused data to a cold or archived tier wherever possible.

##### Data Archiving

Azure Blobs offers four tiers for data archiving: Hot, Cool, Cold and Archive.

We can use [data life cycle management](https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview) to automatically cycle our files to different tiers when they haven't been accessed for a specified time. For example, we could transfer files to the cool tier after 30 days of no modification and to the archive tier 90 days after modification.

Assuming the above policy, let's recalculate our Azure costs using the following rough estimates:

**Hot Tier:** 450 GB (last month of data)\
**Cool Tier:** 900 GB (previous three months of data - Hot Tier amount)\
**Archive Tier:** 249,000 TB (250,000 TB - Hot and Cool Tier)

**Hot Tier Reads:** 9 billion\
**Hot Tier Writes:** 9 billion

**Cool Tier Reads:** < 10 thousand (significantly reduced as the files haven't been accessed in > 30 days)\
**Cool Tier Writes:** 9 billion (the same amount of data transferred as hot)

**Hot Tier Reads:** < 10 thousand (significantly reduced as the files haven't been accessed in > 30 days)\
**Hot Tier Writes:** 9 billion (same amount of data transferred as hot)

After performing a new calculation we get [$2 million AUD per month](https://azure.com/e/eeca9192e563492980529a90dce8a0ed).

![A more manageable Azure bill](/assets/images/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/big-azure-costs.png)
**Figure: A more manageable Azure bill**

That's a massive price reduction! It's still expensive, but at least it's manageable now. 

Costs can vary wildly depending on how we optimize the system. For this reason, you should do a more detailed deep dive into cost before the real implementation.

### 9. What security measures do we need in place?

Azure Blob Storage comes with out-of-the-box [service-side encryption](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption), which means we already have a good level of security once the data is in the cloud.

To get the data into the cloud securely, we will need to implement [client-side encryption](https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption#client-side-encryption-for-blobs-and-queues) which is well supported by Blob Storage as well

### 10. How do we enable the sharing of data with permissions?

To support sharing, we will need a way for users to authenticate and authorize the app. We can integrate with [Microsoft Entra](https://learn.microsoft.com/en-us/entra/) to enable tight integration with the Azure ecosystem. 

We will want to be able to sign on with many providers in our system (e.g. Microsoft, Google, Facebook) because this is a convenient method for our users; it offloads logic to battle-tested 3rd party systems and is often more secure. Enabling login this way is called the [Federated Identity Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/federated-identity) and we can achieve it by using a 3rd party service like [Duende IdentityServer](https://duendesoftware.com/products/identityserver) to manage the authentication process and interface with our users in Microsoft Entra ID

So, we will need a server that hosts our IdentityServer and a database to store users and claims added to our architecture.

We will also need a way to share files between users. This sharing can be accomplished using [Shared Access Signatures](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview). When a file is shared with a user, we can generate a Shared Access Signature, store an encrypted copy in the database and use this to determine who has access.

![The architecture with identity](/assets/diagrams/2024-08-04-System-Design-in-Azure-for-clients-cloud-file-sharing-system/3.png)\
**Figure: The architecture with identity**

### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits
- **Highly Available:** Our files are stored in Blob storage, which provides high availability.
- **Consistent:** ACID compliant file metadata ensuring that users can reliably retrieve the state of a file.
- **User Authentication:** Is enabled and provides file sharing.
- **Smooth UX:** The system can provide smooth UX regardless of bandwidth.
- **Cost:** has been managed to reduce bill shock.
- **Reliable:** data has redundancies to ensure it won't be lost.
- **Scalable:** It is ready to be used by millions of users.

#### Deficiencies
- **Expensive:** Costs a lot to run.
- **Scalability:** Long polling may not continue to be viable as load increases.
- **Collaborative editing:** Doesn't support real-time collaborative editing of documents.
- **User Experience:** When file conflicts occur, there is room for improvement in how it is managed.

🎉 Congratulations - you've got a happy and informed client.

## References

- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
- [DesignGurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b63ac93e7ae59a1afd1)
- [System Design School](https://systemdesignschool.io/problems/dropbox/solution)