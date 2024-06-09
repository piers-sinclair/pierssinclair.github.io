---
layout: post
title:  "🧩 Working with clients to design systems in Azure - URL Shortener"
date:   2024-06-09 12:52:53 +1000
categories: systems-design
author:
- Piers Sinclair
published: false
---

Welcome to my series on Systems Design in Azure, where I take you through designing a complex system on the Azure platform.

## Phase 1 - Requirements Gathering

Let's assume your client somes to you and says:
"Please build us a URL shortener, similar to TinyUrl.com"

First establish **functional requirements** by relaying with the client. Here's how the chat might go:

Q: So the system should take a long URL and generate a shorter URL?\
A: Yes.

Q: And that shorter URL should redirect users back to the long URL?\
A: Yes

Q: How long should the short URL be?\
A: I'm open to your recommendation but as short as possible.

Q: Should it be human readable?\
A: It doesn't have to be but users should have the option to define a custom one.

Q: Should the URLs expire?\
A: They should live forever but if the users want they can set an expiry date.

Q: Can users delete or archive URLs?\
A: Yes they can do both.

Q: Do you need any analytics on the URLs, for example number of clicks?\
A: It's a nice-to-have but not MVP

Now we have our baseline functional requirements. Here's a summary:

- Create a short URL from a long URL by generating an id.
- Short URLs redirect you to the long URL.
- Short URLs should be as short as possible and do not have to be human readable.
- Users can specify a custom id.
- Short URLs can be set to expire but do not expire by default.
- Short URLs can be archived and deleted.
- (optional) Analytics - System tracks number of short URL clicks.

Before moving on, repeat back your summary with the client to double check you are on the same page.

Now we need to establish the **non-functional requirements**. In this case, the non-functional requirements are fairly obvious but it's still good to check you are on the same page. Here's how the chat might go:

Q: I assume when users open the short URL the redirect must be fast and seamless?\
A: Yes

Q: I assume that the short URLs must always be working?\
A: Yes

Q: For security, we should ensure that short URLs are difficult to guess, do you agree?\
A: Yes

Q: How many URLs do you expect to be created daily?\
A: 10 million

Q: How many URLs do you expected to be clicked daily?\
A: 1 billion

Now repeat back your summary of the non-functional requirements:
- Low latency - Short URLs redirect you almost instantly to ensure a seamless user experience
- High availability - Short URLs are always available
- Security - Short URLs should be difficult to guess
- Daily URLs created: 10 million
- Daily URLs clicked: 1 billion

## Phase 2 - Answering the Technical Questions
At this stage, you should have a few technical questions in mind:

1. What are the basic things we will need?
2. How will we store the URLs?
3. How will we generate the URLs?
4. How do we ensure high availability?
5. How can we optimize the deletion and archival of URLs?
6. How do we track the analytics?

### 1. What are the basic things we will need?
First up we need an API and a way top manage horizantal scaling of that API to ensure high availability. That means we need a load balancer such as [Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) and an application server such as [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/).

### 2. How will we store the URLs?
The data we are going to store is relatively simple.

All we need are a `users` table and a `URLs` table.

On the other hand, the amount of data to store is large. Let's assume that a URL is 500 bytes (it's just text fields, no images or video).

`500 Bytes * 10 Million URLs = ~5 GB per day`
`5 GB * 365 days = ~2 TB per year`

Since there are not many relationships involved and the volume of data is going to be large we probably want to lean towards a NoSQL database because:
- They can scale horizontally.
- They are optimized for write operations

However, we still need to have a table like structure, complex querying capability, and a relationship between URLs and users. So a Document DB is the most appropriate type of NoSQL database.

[Azure CosmosDB](https://learn.microsoft.com/en-us/azure/cosmos-db/) is generally the Document DB of choice on Azure, so we will roll with that.

![Storing a Short URL](..\assets\diagrams\2024-06-09-Working-with-clients-to-design-systems-in-Azure-URL-Shortener\1.png)
**Figure: Architecture for storing the short URLs**

### 3. How will we generate the URLs?
To generate a URL we need a unique id that replaces the original url. The client has mentioned they would like it short, but are open to your recommendation for how long.

#### 3.1 How many digits?
For this part, some simple maths should give you a good answer. We want to calculate how many ids can be created for a given length. Ideally, it should be a significantly large number of URLs will last us well into the future.

The client doesn't care how readable it is, but for assuming people are going to be using these URLs, it should still be relatively easy to process visually. For that reason, it's probably best to limit the id to alphanumeric characters.

For encoding, we could go with base36 (0-9 and a-z) or base 62 (0-9, a-z and A-Z).
Base36 Advantage: It's more friendly to always enter lower case letters when typing a URL.
Base64 Advantage: We can possibly have a shorter key because it gives more permutations.

We will go with base36, but both are valid options and it could even be valid to explore other types of encoding as well.

Let's calculate the permutations for base36 with different length keys:

Length: `6`\
Permutations: `~2 billion`\
Time to run out: `2 billion / 10 million = 200 days = ~0.5 years`

Length: `7`\
Permutations：`~78 billion`\
Time to run out: `78 billion / 10 million = 7800 days = ~21 years`

Length: `8`\
Permutations: `~3 Trillion`\
Time to run out:  `3 trillion / 10 million = 300,000 days = ~821 years`

Length: `9`\
Permutations: `~101 Trillion`\
Time to run out:  `101 trillion / 10 million = 10,100,000 days = ~28,000 years`

We can discard 6 straight away, running out in less than a year is obviously unacceptable.

We can also discard 9, 8 gives us 821 years which is more than we will ever need, so going to 9 makes the URL longer without much upside.

So it's between 7 and 8. 7 could be adequate since 21 years is a long time, and we could revisit the problem later. However, if we underestimated the number of daily users things could get out of hand. Additionally, we know we will hit a wall eventually.

Since an extra character isn't the biggest deal, 8 seems like a better choice because even if daily users ends up being significantly more than expected we most likely won't run out.

#### 3.2 How to handle custom ids?
Users also need the ability to add a custom id. 

That's relatively easy, check the database for the existence of that key and if it doesn't exist allow them to create it.

Note that this URL could be of any size, but that doesn't matter since the user is defining it. You do need to check for validation issues though, some characters may not be supported.

#### 3.3 How to generate the keys?
There are a few options to consider in generating the keys.

**Sequentially:** We could generate the keys by sequentially iterating to the next value. 
**Problem:** This would violate the non-functional requirement around making the URL difficult to guess.

**Random Generation**: We could randomly generate each digit in the key.
**Problem:** The more keys we generate, the more chance there is of a duplicate occuring, slowing down the service as duplicates must be handled.

**Hashing:** We could use a hashing algorithm (e.g. MD5) to create a hashcode based on the URL and take the first 8 digits.
**Problem:** It's still relatively likely that a duplicate key will occur and we will need to handle that problem. For example, we could increment a number everytime a collision occurs, append that to the long URL and repeat the hashing process until the key is unique

**Key Generation Service (KGS)**: Creating a service which runs in the background helps eliminate many of the shortcomings of the previous 3 solutions. The service creates unique keys and stores them in preparation for use by the URL shortener.
**Problem:** This solution introduces additional cost and complexity. We now need to maintain the service and ensure it is highly available so that it is not a single point of failure.

There are other solutions to this problem as well, but as you can see each solution has a trade-off.

For our solution we will adopt the KGS which is a robust but complex solution.

To make the service work we will need a service like [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-csharp) to create keys.

We will also need a way to store our keys, this can be done in [Azure Cosmos DB for Table](https://learn.microsoft.com/en-us/azure/cosmos-db/table/introduction). Cosmos DB is guaranteed to be 99.9% highly available out-of-the-box but we can choose to increase that to 99.99% with a different replication strategy.

![Storing a Short URL](..\assets\diagrams\2024-06-09-Working-with-clients-to-design-systems-in-Azure-URL-Shortener\2.png)
**Figure: Architecture for the Key Generation Service**

### 4. How do we ensure high availability?

We've already covered some aspects of high availability in this architecture. There are 2 more important concepts we need to include:
- Data Partioning
- Caching

#### 4.1 Data Partitioning
We want to horizontally scale our URL database. Luckily Cosmos DB supports partitioning out-of-the-box.

When we retrieve our long URLs we are always providing the short URL. For this reason, we can partition based on the [id we generated for our short URL](https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview#use-item-id-as-the-partition-key). Simple!

#### 4.2 Caching
Generally with URLs, a small portion of viral ones receive most of the traffic. For these URLs, it would be awesome to cache them so that the load on the rest of the system is reduced.

Using the [Cache Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) with a least-recently-used eviction policy should naturally lead to the most frequently accessed items being cached.

[Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview) is the right tool for this job.

![Caching frequently used URLs](..\assets\diagrams\2024-06-09-Working-with-clients-to-design-systems-in-Azure-URL-Shortener\2.png)
**Figure: Architecture for caching URLs that are often used **

## References
Here are some of the main resources I used to understand this topic:
- [Design Gurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b5dac93e7ae59a1af6b)
- [System Design School Course](https://systemdesignschool.io/problems/url-shortener/solution)
- [Educative.io Course](https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers/design-and-deployment-of-tinyurl)
- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF0)
- [ByteByteGo Website](https://bytebytego.com/)
