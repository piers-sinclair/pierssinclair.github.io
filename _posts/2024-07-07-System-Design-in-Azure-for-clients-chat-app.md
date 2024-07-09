---
layout: post
title:  "🧩 System Design in Azure for Clients - Chat App"
date:   2024-07-08 01:00:00 +1000
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

"Please build us a chat app similar to [Facebook Messenger](https://www.messenger.com/)"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: Who will use the app?\
A: It will be used by users on our existing social media website where users can start and participate in discussions.

Q: Where is user data stored?\
A: We have an instance of Azure SQL which tracks data.

Q: Can we see a diagram of the existing applications architecture?\
A: Sure, here you go:

![Existing architecture of the client's social media website](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/1.png)\
**Figure: Existing architecture of the client's social media website**

Q: Is this a real-time system or something more like email?\
A: Real-time, we already have something like email but our users are complaining that they can't talk more fluidly.

Q: Do we need to support group chats? If so how many users in a single group chat?\
A: Yes, the more users the better!

Q: More users means more costs and difficulties with the architecture. Would you be happy with a limit of 100 users?
A: Oh I didn't realise, 100 users is more than enough.

Q: Do we need to support video or phone calls?\
A: Not for the MVP

Q: Do we need to support files and attachments?\
A: Yes

Q: How about notifications, is it important for users to know they've received a message?\
A: Yes, if they are offline.

Q: Do users need to know who is online and offline?\
A: That would be useful.

Q: Do we need to show whether a message has been sent and read?\
A: I think that would be better for the UX.

Q: Do we need to support unsending messages?\
A: Not for the MVP.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Real-time conversations between users.
- Conversation groups of up to 100 people.
- User status tracking to show online/offline
- Message status tracking to show sent + read.
- Notifications for new messages to offline people.
- File attachments

Out of scope:
- Video + Phone calls
- Group chats of over 100 people
- Unsending messages

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: What is the driving reason for this new system?\
A: Users are complaining because they want to chat to other users quickly and easily at any time.

Q: If we need to store data locally, there will be some design and architectural challenges, and also users won't have their data backed up. On the other hand, users may see cloud storage as less secure. Would your users be happy to have their data in the cloud.?\
A: I don't think they would have a problem with it.

Q: How important is end-to-end encryption?\
A: We'd like it eventually but not required for the first version. We just want to get something out ASAP.

Q: How many users do you have?\
A: 10 million.

Q: How many messages do you expect each user to send per day?\
A: Maybe 10

Q: Where are your users located?\
A: Mostly in the US.

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **User Experience:** The system should feel real-time.
- **Reliable:** The system must have trust in the messages being delivered.
- **Available:** The users should trust that the system is always available to them.
- **Users:** 10 million
- **Messages per user per day:** 10

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. How do we store message data? 
2. How do we enable real-time communication?
3. How do we preserve message sequence?
4. How do we track user status?
5. How do we track message status?
6. How do we store files?
7. How do we enable notifications?

### 1. How do we store message data? 
According to [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem) **partition tolerance** is a necessary requirement of distributed systems to mitigate problems if the network fails. This theory means we need to choose between availability and consistency.

In our case, **availability** is crucial because our users are chatting in real time.

On the other hand, **consistency** isn't as important because it's not a big deal if a user sees slightly incorrect data as long as we have [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency).

For these reasons, a Key-Value store database like [Azure Cosmos DB for Table](https://learn.microsoft.com/en-us/azure/cosmos-db/table/introduction) is a good option because it provides Availability and Partition Tolerance (AP) with eventual consistency.

#### 1.1 How do we shard the data?
We will need some way to shard our message data and there are a few options:
- **Message ID:** This isn't a good option because retrieval of messages for a chat would need to hit many shards.
- **User ID:** User ID is a good choice, because we will be able to retrieve all messages for a particular user with ease. The downside is that there is a bit more complexity in data retrieval because when loading a conversation we need to collate data from multiple users and figure out which messages relate to a given chat. It also may mean slower retrieval for large group chats since there will be many users. 
- **Conversation ID:** Conversation ID is an alternative to User ID. It makes the retrieval logic straightforward since you can load all messages for a given chat. It also makes searching that chat a much easier endeavour. The downside here is we could end up with large shards for particularly active conversations.
- **Conversation ID + Temporal:**  Shard conversations by the most recent 5000 messages, with each subsequent shard containing the next 5000 messages. This approach alleviates the balancing concerns of sharding on Conversation ID. However, it adds complexity and makes retrieving historical messages slower. Regardless, it's a strong option that we will go with.


### 2. How do we enable real-time communication?
HTTP and Polling are not good options.
Long Polling vs Web Socket

User 1 connects to server 1
User 2 connects to server 2
Server 1 talks to server 2 via message queues

### 3. How do we preserve message sequence?
Can't use auto increment id because most NoSQL doesn't offer it.
Need a service to gen ids. Could make ids unique to only the conversation.

### 4. How do we track user status?
User login
User logout
User disconnects

Heartbeat to check if they disconnected

Via Pub Sub and websocket friends find out about status

Where do we store user status? - Also in Cosmos DB because it's transitory information.

### 5. How do we track message status?

For Sent - Sending user's chat server can respond once it receives the message
For Read - Receiving user's device can notify the server once they have seen the message.

### 6. How do we store files?
Azure Blob storage

### 7. How do we enable notifications?
See [the notification system article](2024-06-30-System-Design-in-Azure-for-clients-notification-system.md)

### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits

#### Deficiencies

🎉 Congratulations - you've got a happy and informed client.

## References

- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
- [Enjoy Algorithms Blog](https://www.enjoyalgorithms.com/blog/design-whatsapp)
- [DesignGurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b65ac93e7ae59a1afe5)
- [System Design School](https://systemdesignschool.io/problems/chatapp/solution)
- [Geeks for Geeks Article](https://systemdesignschool.io/problems/chatapp/solution)
