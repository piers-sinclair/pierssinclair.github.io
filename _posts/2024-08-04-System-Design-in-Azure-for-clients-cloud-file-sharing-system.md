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

Q: How much data do you expect them to upload and download per week?
A: 50 MB for upload and a similar amount for download.

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **Reliable:** The users must trust that data will not be lost.
- **Consistency:** The state of data should always be communicated consistently to users to avoid confusing behaviour.
- **Secure:** The system should feel real-time.
- **Available:** The users should trust that they can get to their files and changes when they want to.
- **Users:** 50 million
- **Data per user:** 5GB
- **Data uploads per user per week:** 50MB
- **Data downloads per user per week:** 50MB

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
- Open: Open's a file on your machine.
- Saved: When a file is created or updated it should be saved.
- Delete: When a file is flagged for removal.
- View Version History: See past versions of the file.
- Search: Search file names (later we could support content or other meta data).
- View Recent: See a list of documents that have been recently viewed or edited.
- Download Copy: Get a copy of the file locally on the user's device.
- Share: Share the file with another person so they can view or edit it.

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

Replicate the data

### 5. How do we manage the syncing process?

Users need to know in asap if a change happens to their file because it will affect their editing flow.

Long polling is an approach for managing notifications.

When a user uploads, it can send a notification to a service bus which the other users subscribe to.

### 6. How are we going to handle conflicting versions of a document?

If there's a conflict we have a few options

- Latest version always overwrites (not good because it means the other user's changes will be lost)
- Prompt to say there is a newer version
- Save a copy.

### 7. How do we ensure smooth UX when badnwidth is low?

- Chunk the data and send it up in [blocks](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block?tabs=microsoft-entra-id).
    - Store duplicate blocks only once
    - Reduced data transfer because only the relevant portion is sent
    - More resilient to network outage because data is sent up in small portions.

If it's a restricted data network (e.g. Mobile networks) then don't download the data until connected to wi-fi or the user requests it.

### 8. How much is this going to cost?

Could get expensive - need to carefully consider Azure Blob pricing against what is charged to customers.

Also need to ensure we are as efficient as possible with data storage e.g. don't store duplicate data twice.

Also if data hasn't been accessed for a long time, archive it into a cold tier.

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