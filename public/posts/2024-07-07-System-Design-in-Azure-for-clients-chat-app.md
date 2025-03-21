---
layout: post
title:  "🧩 System Design in Azure for Clients - Chat App"
date:   2024-07-11 01:00:00 +1000
categories: system-design
tags: system-design, azure, software-architecture, cloud-architecture, solution-architecture
author: Piers Sinclair
published: true
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
A: It will be used by users on our existing social media website, where users can start and participate in discussions.

Q: Where is user data stored?\
A: We have an instance of Azure SQL, which tracks user data.

Q: And what technology is the social media website built in?\
A: ASP.NET Core and React.

Q: Can we see a diagram of the existing application architecture?\
A: Sure, here you go:

![The existing architecture of the client's social media website](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/1.png)\
**Figure: The existing architecture of the client's social media website**

Q: Is this a real-time system or something more like email?\
A: Real-time, we already have something like email, but our users complain that they cannot talk more fluidly.

Q: What are the chats used for? Do they exist temporarily, such as for support, or are they permanent chats with history?\
A: Permanent chats with history it's for our users to connect.

Q: Do we need to support group chats? If so, how many users are in a single group chat?\
A: Yes, the more users, the better!

Q: More users means more costs and difficulties with the architecture. Would you be happy with a limit of 100 users?\
A: Oh, I didn't realise that 100 users is enough.

Q: Do we need to support video or phone calls?\
A: Not for the MVP

Q: Do we need to support files and attachments?\
A: Yes

Q: How about notifications? Is it important for users to know they've received a message?\
A: Yes, if they are offline.

Q: Do users need to know who is online and offline?\
A: That would be useful.

Q: Do we need to support unsending messages?\
A: Not for the MVP.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Real-time conversations between users.
- Permanent conversations with history.
- Conversation groups of up to 100 people.
- User status tracking to show online/offline
- Notifications for new messages to offline people.
- File attachments

Out of scope:
- Video + Phone calls
- Group chats of over 100 people
- Unsending messages

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: What is the driving reason for this new system?\
A: Users complain because they want to chat with other users quickly and easily.

Q: If we need to store data locally, there will be design and architectural challenges, and users won't have their data backed up. On the other hand, users may see cloud storage as less secure. Would your users be happy to have their data in the cloud.?\
A: I don't think they would have a problem with it.

Q: How important is end-to-end encryption?\
A: We'd like it eventually, but it's optional for the first version. We want to get something out ASAP.

Q: How many users do you have?\
A: 10 million.

Q: How many messages do you expect each user to send daily?\
A: Maybe 10

Q: Where are your users located?\
A: Mostly in the US.

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **User Experience:** The system should feel real-time.
- **Reliable:** The users must trust that the messages will be delivered.
- **Available:** The users should trust that the system is always available.
- **Users:** 10 million
- **Messages per user per day:** 10

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. How do we store message data? 
2. How do we enable real-time communication?
3. How do we preserve the sequence of messages?
4. How do we track user status?
5. How do we ensure message delivery?
6. How do we store files?
7. How do we enable notifications?

### 1. How do we store message data? 
According to [CAP Theorem](https://en.wikipedia.org/wiki/CAP_theorem), **partition tolerance** is a requirement of distributed systems to mitigate problems if the network fails. This theory means we need to choose between availability and consistency.

In our case, **availability** is crucial because our users chat in real-time.

On the other hand, **consistency** isn't as crucial because it's not a big deal if a user sees slightly incorrect data as long as we have [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency).

For these reasons, a Key-Value store database like [Azure Cosmos DB for Table](https://learn.microsoft.com/en-us/azure/cosmos-db/table/introduction) is a good option because it provides Availability and Partition Tolerance (AP) with eventual consistency.

#### 1.1 How do we shard the data?
We will need some way to shard our message data, and there are a few options:
- **Message ID:** This is a bad option because retrieval of messages for a chat would need to hit many shards.
- **User ID:** User ID is a good choice because we will be able to easily retrieve all messages for a particular user. The downside is that there is a bit more complexity in data retrieval because when loading a conversation, we need to collate data from multiple users and figure out which messages relate to a given chat. It also may mean slower retrieval for large group chats since there will be many users. 
- **Conversation ID:** Conversation ID is an alternative to User ID. It makes the retrieval logic straightforward since you can load all messages for a given chat. It also makes searching that chat a much easier endeavour. The downside is that we could have large shards for particularly active conversations.
- **Conversation ID + Temporal:** Shard conversations by the most recent 5000 messages, with each subsequent shard containing the following 5000 messages. This approach alleviates the balancing concerns of sharding on Conversation ID. However, it adds complexity and makes retrieving historical messages slower. Regardless, it's a strong option that we will go with.


### 2. How do we enable real-time communication?
There are many ways to enable communication through chat. In the early days of messaging apps, HTTP was often used. However, it has a problem because it enables strong one-way communication for sending to the server but doesn't make receiving messages easy. So, there are better options.

[Polling](https://en.wikipedia.org/wiki/Polling_(computer_science)) might be the first candidate to jump to because it enables two-way communication. However, this approach is noisy and will involve lots of unnecessary calls to the service.

[Long Polling](https://www.enjoyalgorithms.com/blog/long-polling-in-system-design0) is a better alternative to Polling because it drastically reduces the number of calls to the service. It's a good option for a messaging app, but we could run into some challenges managing connections.

[WebSocket](https://en.wikipedia.org/wiki/WebSocket) is an awesome choice for a messaging app because it enables two-way communication via a constant connection. As long as users are online, they will be able to send and receive communications smoothly.

In Azure, we have 2 good options for connecting via WebSocket:
- [Azure SignalR](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-overview)
- [Azure Web PubSub](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/overview)

Either option is fine, but we'll choose Azure SignalR because our client has an ASP.NET Web API, and SignalR works well with the .NET ecosystem. See [this link](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/resource-faq#how-do-i-choose-between-azure-signalr-service-and-azure-web-pubsub-service) for more details on the differences between the two.

We can also isolate our chat app from the main website API using an Azure Function. This isolation will make the chat app scaling more robust because the usage requirements will likely differ from those of the social media app.

Finally, you might have noticed that the client already uses Azure Front Door as a load balancer. This service won't work for the chat functionality because Azure Front Door doesn't support WebSocket. Instead, we can use Application Gateway, which [does support WebSocket](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-websocket)

![Starting architecture of the client's chat app](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/2.png)\
**Figure: Starting architecture of the client's chat app**

### 3. How do we preserve the sequence of messages?
Our architecture nicely enables real-time communication, but we have a problem. There is no guarantee that messages will be delivered in order.

To fix this issue, we need to auto-increment the message IDs in a conversation. Most NoSQL databases do not offer auto-increment IDs, so our message processing service will need to manage this for us.

### 4. How do we track user status?
User status is another interesting problem. Tracking manual login and logout of the social media app is straightforward because the client sends this information to the server, but what about when the user disconnects?

In that case, the client won't be able to communicate the status to our server. To solve this problem, we can send a regular heartbeat to check that a user is still there. We can set our [SignalR clients to send a regular ping](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/websockets?view=aspnetcore-8.0#handle-client-disconnects) if the server doesn't receive a ping for 5 minutes, we can assume the user has gone offline. In addition, to ensure a smooth UX, we probably want the client to reconnect when they lose connection [this process is trivial in SignalR](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-8.0&tabs=visual-studio#automatically-reconnect)

We'll also need to store the user status somewhere. Our chat app will need a way to start new chats and view friends and their statuses. Due to this functionality, we need access to user status outside of the context of a conversation. Thus, we won't want to store it in the same shard as our conversations because we need access to the data outside that context. We'll also want user status communicated quickly to ensure smooth UX, and user statuses will frequently change, leading to high numbers of transactions. For these reasons, storing it in a cache is a good option.

We could use either of the following:
- [Azure Cosmos DB integrated cache](https://learn.microsoft.com/en-us/azure/cosmos-db/integrated-cache)
- [Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview)

We are going with Azure Cache for Redis because we need a way for our users to subscribe to other users' status changes, and [Azure Cache for Redis comes with Pub/Sub out-of-the-box](https://learn.microsoft.com/en-us/training/modules/azure-redis-publish-subscribe-streams/). Azure Cosmos DB integrated cache is an acceptable alternative, but we would also need to implement [Azure Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview) which introduces more complexity.


![Our chat app with Redis Cache for reporting user status](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/3.png)\
**Figure: Our chat app with Redis Cache for reporting user status**

### 5. How do we ensure message delivery?
Ensuring message delivery involves tracking the status of a message as it progresses from user 1's device to user 2's device. The flow looks like this:

1. User 1 sends a message to the messaging service
2. The messaging service does the following:
    a. Stores the message in the database as undelivered
    b. Sends an acknowledgement to user 1
    c. Sends the message to user 2.
3. User 2's client then returns an acknowledgement to the messaging service.
4. The messaging service marks the message as delivered in the database.

Through this flow, we always know if User 2's client has received a message and can retrieve undelivered messages accordingly.

### 6. How do we store files?
Storing files is simple. We throw the media in [Azure Blob Storage](https://azure.microsoft.com/en-au/products/storage/blobs) and add a reference in our message that is stored in Azure CosmosDB. Then, we retrieve the data when required.

In lower-level designs, it may be worth considering:
- File compression to reduce data storage cost
- User storage limits because with unlimited data, it could get expensive.

For now, we will leave these out-of-scope.

![Our chat app with media storage](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/4.png)\
**Figure: Our chat app with media storage**

### 7. How do we enable notifications for offline users?
If users are offline, it would be good to send them notifications so they know a new message has come through. To solve this problem, we can, we can have our messaging service check if a user is offline in the user status cache, and if they are, it can send out a notification via a notification system similar to the one in [this article](https://www.piers-sinclair.com/system-design/2024/06/30/System-Design-in-Azure-for-clients-notification-system.html)


![Our chat app with a notification system](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/5.png)\
**Figure: Our chat app with a notification system**


## Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

### Benefits
- **Real-time UX:** Users can chat in real-time and see the status of other users.
- **Scalable:** We can support millions of users, and our services, such as Azure Functions and Azure Cosmos DB, can easily scale horizontally.
- **Reliable:** The system is resistant to failure because it tracks message status, and users will have confidence that their messages have been delivered.
- **Available:** The system uses Azure services, which guarantee high availability.

### Deficiencies
- **Consistency:** Messages and user status may not always be consistent, but this is not a critical priority for a chat app.
- **Complexity:** It's a very complex system with many different pieces the development team needs to understand.
- **Cost:** We are making use of a lot of expensive services in Azure, so before implementing, we should perform a complete cost analysis using the [Azure calculator](https://azure.microsoft.com/en-gb/pricing/calculator/)

🎉 Congratulations - you've got a happy and informed client.

## References

- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
- [Enjoy Algorithms Blog](https://www.enjoyalgorithms.com/blog/design-whatsapp)
- [DesignGurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b65ac93e7ae59a1afe5)
- [System Design School](https://systemdesignschool.io/problems/chatapp/solution)
- [Geeks for Geeks Article](https://systemdesignschool.io/problems/chatapp/solution)