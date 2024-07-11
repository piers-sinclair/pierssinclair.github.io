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

Q: And what technology is the social media website built in?\
A: ASP.NET Core and React

Q: Can we see a diagram of the existing applications architecture?\
A: Sure, here you go:

![Existing architecture of the client's social media website](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/1.png)\
**Figure: Existing architecture of the client's social media website**

Q: Is this a real-time system or something more like email?\
A: Real-time, we already have something like email but our users are complaining that they can't talk more fluidly.

Q: What are the chats used for? Do they exist temporarily such as for support or are they permanent chats with history?\
A: Permanent chats with history, it's for a our users to connect with each other.

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
5. How do we ensure message delivery?
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
There are lots of ways of enabling communications for chat. In the early days of messaging apps, HTTP was often used. However, it has a problem because it enables strong 1 way communication for sending to the server, but doesn't make receiving messages easy. So there are better options.

[Polling] might be the first candidate to jump to because it enables 2 way communication, but the problem with this approach is that it is noisy and will involve lots of unecessary calls to the service.

[Long Polling](https://www.enjoyalgorithms.com/blog/long-polling-in-system-design0) is a better alternative to polling because it drastically reduces the number of calls to the service. It's not a bad option for a messaging app but we could run into some challenges with managing connections.

[WebSocket](https://en.wikipedia.org/wiki/WebSocket) is an awesome choice for a messaging app because it enables two way communication via a constant connection. As long as users are online they will be able to smoothly send and receive communications.

In Azure we have 2 good options for websocket:
- [Azure SignalR](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-overview)
- [Azure Web PubSub](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/overview)

Either option is fine but we'll go with Azure SignalR because our client has an ASP.NET Web API and SignalR works well with the .NET ecosystem.

We can also isolate our chat app from the main website API using an Azure Function. This will make the chat app scaling more robust because the usage requirements are likely to be different to the social media app.

Finally, you might have noticed that the client is already using Azure Front Door as a load balancer. This won't work for the chat functionality because Azure Front Door doesn't support web socket. Instead, we can use Application Gateway which [does support web socket](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-websocket)

![Starting architecture of the client's chat app](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/2.png)\
**Figure: Starting architecture of the client's chat app**

### 3. How do we preserve message sequence?
Our architecture enables real-time communication nicely, but we have a problem. There is no guarantee messages will be delivered in order.

To fix this issue we need to auto increment the message IDs in a conversation. Most NoSQL databases do not offer auto increment IDs so our message processing service will need to manage this for us.

### 4. How do we track user status?
User status is another interesting problem. Tracking manual login and logout of the social media app is straightforward because the client will send through this info to the server, but how about when the user disconnects?

In that case the client won't communicate the status to our server. To solve this problem we need to send a regular heartbeat to check that a user is still there. We can set our [SignalR clients to send a regular ping](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/websockets?view=aspnetcore-8.0#handle-client-disconnects), if the server doesn't receive a ping for 5 minutes, we can assume the user has gone offline. In addition to ensure a smooth UX we probably want the client to reconnect when they lose connection, [this process is trivial in SignalR](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-8.0&tabs=visual-studio#automatically-reconnect)

We'll also need to store the user status somewhere. Our chat app will need a way to start new chats, view friends and their status. Due to this functionality, we need access to user status outside of the context of a conversation. Thus we won't want to store it in the same shard as our conversations because we need access to the data outside of that context. We'll also want user status communicated quickly to ensure smooth UX, and user statuses will change frequently leading to high numbers of transactions. For these reasons, storing it in a cache is a good option.

We could use either of the following:
- [Azure Cosmos DB integrated cache](https://learn.microsoft.com/en-us/azure/cosmos-db/integrated-cache)
- [Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview)

We are going with Azure Cache for Redis because we need a way for our users to subscribe to other user's status changes and [Azure Cache for Redis comes with Pub/Sub out-of-the-box](https://learn.microsoft.com/en-us/training/modules/azure-redis-publish-subscribe-streams/). Azure Cosmos DB integrated cache is a fine alternative, but we would also need to implement [Azure Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview) which introduces more complexity.


![Our chat app with Redis Cache for reporting user status](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/3.png)\
**Figure: Our chat app with Redis Cache for reporting user status**

### 5. How do we ensure message delivery?
Ensuring message delivery involves tracking the status of a message as it progresses from user 1's device to user 2's device. The flow looks like this:

1. User 1 sends a message to the messaging service
2. Messaging service  does the following:
    1. Stores the message in the database as undelivered
    2. Sends an acknowledgement to user 1
    3. Sends the message to user 2.
3. User 2's client then sends an acknowledgement back to the messaging service.
4. The messaging service marks the message as delivered in the database.

Through this flow we always know if User 2's client has received a message and can retrieve undelivered messages accordingly.

### 6. How do we store files?
Storing files is simple, we throw the media in [Azure Blob Storage](https://azure.microsoft.com/en-au/products/storage/blobs) and add a reference in our message that is stored in Azure CosmosDB. Then we retrieve the data when required.

Once doing lower level designs, you may also want to consider compressing files but we will leave this out of scope for our example.

![Our chat app with media storage](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/4.png)\
**Figure: Our chat app with media storage**

### 7. How do we enable notifications for offline users?
If users are offline it would be good to send them notifications so they know a new message has come through. To solve this problem we can we can have our messaging service check if a user is offline in the user status cache, and if they are it can send out a notification via a notification system similar to the one in [this article](2024-06-30-System-Design-in-Azure-for-clients-notification-system.md)


![Our chat app with a notification system](/assets/diagrams/2024-07-07-System-Design-in-Azure-for-clients-chat-app/5.png)\
**Figure: Our chat app with a notification system**


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
