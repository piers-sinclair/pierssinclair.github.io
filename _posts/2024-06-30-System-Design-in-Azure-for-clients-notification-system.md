---
layout: post
title:  "🧩 System Design in Azure for Clients - Notification System"
date:   2024-06-30 08:00:00 +1000
categories: system-design, azure, software-architecture, cloud-architecture, solution-architecture
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

"Please build us a notification system for our discussion board"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: What channels do the notifications need to be delivered by?\
A: We want it to pop-up on their phone/pc, email and SMS.

Q: How does the system know the user's email and SMS?\
A: When they sign-up for the discussion board we prompt for their information

Q: Do you have a mobile or desktop app?\
A: We have a mobile app but no desktop one.

Q: When do you want users to be notified?\
A: They should be notified if someone comments on a post that they have made, watched or commented on.

Q: I assume they need to be able to "unwatch" a post as well?\
A: Yes, as it might no longer be relevant to them.

Q: How are the posts and comments stored?\
A: When the users create a post or comment our web api is called and stores it in an Azure Cosmos DB NoSQL database.

Q: And how about users?\
A: The users are in a different Azure Cosmos DB instance.

Q: I recommend we have a user settings page to give user's control so they don't feel intruded upon. Do you agree?\
A: Yep sounds like a good idea.

Q: Do you need analytics?\
A: Not for the initial app, we can explore that later once the base notifications are working.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Mobile, Desktop, Email and SMS notifications
- A user settings page
- Set a watch on a post
- Ability to "unwatch" a post

Out of scope:
- Analytics

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: How many users do you have?\
A: 10 million.

Q: How many posts are created everyday?\
A: 500 thousand.

A: How many comments are there on average per post?\
A: 10

Q: Where are your users located?\
A: Mostly in the US.

Q: Do the notifications need to happen in realtime?\
A: No, it's ok if they are delayed.

Q: What are the most important factors to you for this system?\
A: We want to ensure users have a good experience, so we want to avoid notifications feeling like they are intrusive .

Now repeat back your summary of the non-functional requirements:
- Scalable - The user base is very large so it will need to be able to cope.
- User Experience - The system should feel like it is not intrusive.
- Users: 10 million
- Posts per day: 500 thousand
- Comments per post: 10

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What's the basic infrastructure for sending a notification?
2. How do we enable users to update their settings page?


### 1. What's the basic infrastructure for sending a notification?

We know there is an existing mobile app, and website. We also know that there are 2 Azure Cosmos DB instances for post/comment data and user data.

So what other components will we need to ensure we can send notifications via different channels?

The first item is a `notification service`, this service is going to read from the users database to get the list of users to send notifications to.

We could have this single service process and send out all the notifications as well, but that would cause a high load on the system if lots of notifications came in at once.

So instead, we can create different `notification channel services` for sending data to different places such as:
- Email Service
- SMS Service
- Mobile Service
- Website Service

For all of our services we can use Azure Functions because it scales very effectively, we won't need a lot of control over application settings and the logic is unlikely to get significantly more complex over time.

At this point there are 2 problems to solve:
1. How will these services deliver the notifications?
2. What happens if one of these services is suddenly unavailable?

#### 1.1 How will these services deliver the notifications?

This problem is solved with 3rd party services.

For email and SMS, we could build out notification functionality ourselves, but there is little reason to do that when tried and tested platforms like [Twilio SendGrid](https://www.twilio.com/en-us/sendgrid/email-api) and [Twilio SMS](https://www.twilio.com/en-us/messaging/channels/sms) exist. They will work out cheaper for most systems, and they are generally more reliable than hand-rolled code since a whole team is focused on the product.

For mobile push notifications, all systems need to go through the services exposed by Apple ([APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns)) and Google ([Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)). So it makes sense for our app to directly interface with those APIs.

For website notifications we need to follow the [Web Push protocol](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol), there are several libraries which can help with this depending on the programming language being used.

Note that if you wanted to simplify working with multiple systems, you could consider using [Azure Notifications Hub](https://azure.microsoft.com/en-au/products/notification-hubs) and [OneSignal](https://onesignal.com/) for push notifications on web, iOS, and Android. However, these providers still need to integrate with Firebase, APNs, etc., adding an extra layer between your code and the notifications. Additionally, these services come with additional costs. Therefore, we won't use these providers in our implementation.

#### 1.2 What happens if one of these services is suddenly unavailable?

So now we know how our notifications are being sent out, but what if one of these services goes down?

Currently, this would cause problems because our `notification service` is highly coupled with the `notification channel services`. So, let's decouple it!

By adding in a messaging system, we can ensure that the `notification service` is fire and forget. It simply puts a message on the queue and let's the `notification channel services` figure out how to process it.

Azure Service Bus is a great option here. We can set it up so that it has a [topic](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions#topics-and-subscriptions) for notifications, subscriptions for each channel type and a [filter](https://learn.microsoft.com/en-us/azure/service-bus-messaging/topic-filters) for the user id.

![Basic architecture for the notifications system](/assets/diagrams/2024-06-30-System-Design-in-Azure-for-clients-notification-system/1.png)\
**Figure: Basic architecture for the notifications system**


### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits
{{ TODO }}

#### Deficiencies
{{ TODO }}
Not catered for countries which may not have access to push notification services
No realtime (bad if there are mission critical notifications)

🎉 Congratulations - you've got a happy and informed client.

## References

- 