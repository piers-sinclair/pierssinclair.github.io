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

"Please build us a notification system for our discussion board."

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: What channels do the notifications need to be delivered by?\
A: We want it to pop up on their phone, web browser, email and SMS.

Q: How does the system know the user's email and SMS?\
A: When they sign up for the discussion board, we prompt them for their information.

Q: Do you have a mobile or desktop app?\
A: We have a mobile app but not a desktop one.

Q: When do you want users to be notified?\
A: They should be notified if someone comments on a post they have made, subscribed to or commented on.

Q: I assume they need to be able to unsubscribe from a post as well?\
A: Yes, as it might no longer be relevant to them.

Q: How are the posts and comments stored?\
A: When users create a post or comment, our web API is called and stores it in an [Azure Cosmos DB NoSQL database](https://learn.microsoft.com/en-us/azure/cosmos-db/).

Q: And how about users?\
A: The users are in a different Azure Cosmos DB instance.

Q: Do you need analytics?\
A: Not for the initial app. We can explore that later once the base notifications are working.

Now, we have our baseline functional requirements. Here's a summary:

In scope:
- Mobile, Website, Email and SMS notifications on subscribed posts.
- Subscribe a user to a post when they post, comment or subscribe.
- Ability to unsubscribe from a post.

Out of scope:
- Analytics

Before moving on, repeat your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**.

Q: How many users do you have?\
A: 10 million.

Q: How many posts are created every day?\
A: 500 thousand.

A: How many comments are there on average per post?\
A: 10

Q: Where are your users located?\
A: Mostly in the US.

Q: Do the notifications need to happen in real-time?\
A: No, it's ok if they are delayed.

Q: What are the most important factors to you for this system?\
A: We want to ensure users have a good experience, so we want to avoid notifications feeling intrusive.

Q: In that case, I recommend we have a user settings page to give users control so they don't feel intruded upon. Do you agree?\
A: Yep, that sounds like a good idea.

Notice how the last question brought into light a new functional requirement? These can be discovered at any time, so make sure you add them to your list:
- Create a user settings page

Now repeat back your summary of the non-functional requirements:
- **Scalable:** The user base is enormous, so it must be able to cope.
- **User Experience:** The system should feel unintrusive.
- **Users:** 10 million
- **Posts per day:** 500 thousand
- **Comments per post:** 10

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. How do we determine when users get notifications?
2. What's the basic infrastructure for sending a notification?
3. How do we ensure users aren't bombarded with notifications?
4. How do we report on faults in 3rd party services?


### 1. How do we determine when users get notifications?

We know there is an existing mobile app and website. We also know that there are 2 Azure Cosmos DB instances for post/comment data and user data. Here's what the starting architecture looks like:

![Starting architecture for the notifications system](/assets/diagrams/2024-06-30-System-Design-in-Azure-for-clients-notification-system/1.png)\
**Figure: Starting architecture for the notifications system**

The first problem to tackle is adapting the system to track who should receive notifications and when.

This problem is reasonably easy to solve. Firstly, we need the users database to store a list of which posts a user is subscribed to.

Then, we need to adapt the current system so that it adds a subscription for the user in these situations:
- User creates a post.
- User comments on a post.
- The user manually subscribes to a post (e.g., using a button).

We also need the system to remove a subscription for the user when they click "unsubscribe".

The other addition we need is the user settings page. These settings can also be stored in the users database and should give the user complete control of the channels where they receive notifications (e.g. Mobile)

### 2. What's the basic infrastructure for sending a notification?

What other components will we need to ensure we can send notifications via different channels?

The first item is a `notification service`. When the API triggers a notification event (e.g. a comment), it sends a request to the `notification service`. This service then reads from the users database to get the list of users to whom notifications should be sent.

We could have this single service process and send out all the notifications, but if many notifications came in simultaneously, the system would be heavily loaded.

So instead, we can create different `notification channel services` for sending data to different places, such as:
- Email Service
- SMS Service
- Android Service
- iOS Service
- Website Service

For all of our services, we can use [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-csharp) because it scales very effectively, we won't need much control over application settings and the logic is unlikely to get significantly more complex over time.

At this point, there are 2 problems to solve:
1. How will these services deliver the notifications?
2. What happens if one of these services is suddenly unavailable?

#### 1.1 How will these services deliver the notifications?

This problem is solved with third-party services.

For email and SMS, we could build out notification functionality ourselves. However, there is little reason to do that when tried and tested platforms like [Twilio SendGrid](https://www.twilio.com/en-us/sendgrid/email-api) and [Twilio SMS](https://www.twilio.com/en-us/messaging/channels/sms) exist. They will work out cheaper for most systems, and they are generally more reliable than hand-rolled code since a whole team is focused on the product.

For mobile push notifications, all systems need to go through the services exposed by Apple ([APNs](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns)) and Google ([Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)). It makes sense for our app to interface with those APIs directly.

For website notifications, we need to follow the [Web Push protocol](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol). Depending on the programming language being used, several libraries can help with this.

Here's what the system looks like with third-party integrations sending out notifications:

![Basic architecture for the notifications system](/assets/diagrams/2024-06-30-System-Design-in-Azure-for-clients-notification-system/2.png)\
**Figure: Basic architecture for the notifications system**

Note that if you wanted to simplify working with multiple systems, you could consider using [Azure Notifications Hub](https://azure.microsoft.com/en-au/products/notification-hubs) and [OneSignal](https://onesignal.com/) for push notifications on web, iOS, and Android. However, these providers still need to integrate with Firebase, APNs, etc., adding an extra layer between your code and the notifications. Additionally, these services come with additional costs. Therefore, we won't use these providers in our implementation.

#### 1.2 What happens if one of these services is suddenly unavailable?

So now we know how our notifications are being sent out, but what if one of these services goes down?

Currently, this would cause problems because our `notification service` is highly coupled with the `notification channel services`. So, let's decouple it!

One way to decouple is to follow the [Publisher-Subscriber pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/publisher-subscriber) through a messaging system. This pattern will ensure that the `notification service` fires and forgets. It simply puts a message on the queue and lets the `notification channel services` figure out how to process it.

Azure Service Bus is a great option here. We can set it up so that it has a [topic](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions#topics-and-subscriptions) for notifications, subscriptions for each channel type and a [filter](https://learn.microsoft.com/en-us/azure/service-bus-messaging/topic-filters) for the user id.

![Decoupled architecture for the notifications system](/assets/diagrams/2024-06-30-System-Design-in-Azure-for-clients-notification-system/3.png)\
**Figure: Decoupled architecture for the notifications system**

### 3. How do we ensure users aren't bombarded with notifications?

Our notifications aren't mission-critical, and there is potential for the user to be sent many notifications in a short period. For this reason, we should [rate limit](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern) the notifications to ensure a better UX.

In our case, we can set a limit of 1 notification per post per hour. That way, the user gets notifications of different posts but won't be spammed by multiple comments on the same post. We can easily apply a rate limit inside the code of our services.

### 4. How do we ensure resiliency and report on faults in 3rd party services?

Utilising third-party services like SendGrid is fantastic for reducing the code we need to write and ensuring a highly resilient system. However, it can be a pain if the system goes down.

There are a few crucial factors to consider:
- A service might go down for a short period before coming back up
- The developers will need to be alerted and provided with information to debug an outage when it occurs.

To solve these problems, we want to ensure that our services implement mechanisms for:
- Logging
- Alerting
- Retry

For logging and alerting, [Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview) is a powerful tool we can enable on our [Azure Function services](https://learn.microsoft.com/en-us/azure/azure-functions/configure-monitoring?tabs=v2). Application Insights gives us much of what we need out-of-the-box, and anything else we need can be done with manual calls to the API.

Retry is straightforward. We want to follow the [retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry). At a basic level, this involves:
1. Re-adding the message to the queue when an attempt to process it fails.
2. Logging the event
3. Reprocessing it after a delay
4. Repeating this process until a maximum number of attempts is reached, and if still unsuccessful, then logging an error and moving the message to the [dead-letter queue](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-dead-letter-queues).

### Phase 3 - Communicating the Sauce

Now, we've got an awesome architecture diagram to show our client, but we also need to communicate the benefits and deficiencies of our system when we talk to the client.

#### Benefits
- **Good UX:** Notifications are rate-limited, and our users have control over their notifications.
- **Scalable:** All components are designed to be scaled up and down easily.
- **Reliable:** Our components are built so they do not rely on each other via Azure Service Bus.
- **Fault-tolerant:** In the event of message queue processing failures, the system uses retries and dead-letter queues.
- **Maintainability:** We have Application Insights to alert us of errors and log issues.


#### Deficiencies
- **Complexity:** The system is highly complex, with many moving parts, making deployment more difficult.
- **Global Availability:** Our system hasn't factored in whether a country can access our third-party services. This problem is not a huge deal because most customers are in the US.
- **Not real-time:** Our notifications may take time to deliver. This delay would be a problem if we needed to send a notification about a login or a security issue.

🎉 Congratulations - you've got a happy and informed client.

## References

- [Geeks for Geeks Article](https://www.geeksforgeeks.org/design-notification-services-system-design/)
- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF0)
- [Enjoy Algorithms Blog](https://www.enjoyalgorithms.com/blog/notification-service)