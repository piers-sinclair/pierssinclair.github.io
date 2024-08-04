---
layout: post
title:  "🧩 System Design in Azure for Clients - URL Shortener"
redirect_from:
  - /system-design,/azure,/software-architecture,/cloud-architecture,/solution-architecture/2024/06/12/System-Design-in-Azure-for-Clients-URL-Shortener.html
date:   2024-06-13 7:52:53 +1000
categories: system-design
tags: system-design, azure, software-architecture, cloud-architecture, solution-architecture
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

"Please build us a URL shortener similar to [TinyURL](https://tinyurl.com)"

## Phase 1 - Requirements Gathering
First, establish **functional requirements** by talking to the client. Here's how the chat might go:

Q: So the system should take a long URL and generate a shorter URL?\
A: Yes.

Q: And that shorter URL should redirect users back to the long URL?\
A: Yes

Q: How long should the short URL be?\
A: I'm open to your recommendation, but as short as possible.

Q: Should it be human-readable?\
A: It doesn't have to be, but users should have the option to define a custom one.

Q: Should the URLs expire?\
A: They should live forever, but the users can set an expiry date.

Q: Can users delete or archive URLs?\
A: Yes, they can do both.

Q: Do you need any analytics on the URLs, for example the number of clicks?\
A: It's a nice-to-have but not MVP

Now, we have our baseline functional requirements. Here's a summary:

- Create a short URL from a long URL by generating an ID.
- Short URLs redirect you to the long URL.
- Short URLs should be as short as possible and don't have to be human-readable.
- Users can specify a custom ID.
- Short URLs can be set to expire but do not expire by default.
- Short URLs can be archived and deleted.
- (optional) Analytics - The system tracks the number of short URL clicks.

Before moving on, repeat back your summary with the client to double-check that you are on the same page.

Now, we need to establish the **non-functional requirements**. In this case, the non-functional requirements are pretty obvious, but checking that you are on the same page is good. Here's how the chat might go:

Q: I assume the redirect must be fast and seamless when users open the short URL?\
A: Yes

Q: I assume that the short URLs must always be working?\
A: Yes

Q: For security, we should ensure that short URLs are difficult to guess. Do you agree?\
A: Yes

Q: How many URLs do you expect to be created daily?\
A: 10 million

Q: How many URLs do you expect to be clicked daily?\
A: 1 billion

Now repeat back your summary of the non-functional requirements:
- Low latency - Short URLs redirect you almost instantly to ensure a seamless user experience
- High availability - Short URLs are always available
- Security - Short URLs should be difficult to guess
- Daily URLs created: 10 million
- Daily URLs clicked: 1 billion

## Phase 2 - Technical Deep Dive
At this stage, you should have a few technical questions in mind:

1. What are the basic things we will need?
2. How will we store the URLs?
3. How will we generate the URLs?
4. How do we ensure high availability?
5. How can we optimize the deletion and archival of URLs?
6. How do we track the analytics?

### 1. What are the basic things we will need?
First, we need an API and a way to manage the horizontal scaling of that API to ensure high availability. That means we need a load balancer such as [Azure Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-overview) and an application server such as [Azure App Service](https://learn.microsoft.com/en-us/azure/app-service/).

### 2. How will we store the URLs?
The data we are going to store is relatively simple.

We only need a `users` table and a `URLs` table.

On the other hand, the amount of data to store is significant. Let's assume that a URL is 500 bytes.

`500 Bytes * 10 Million URLs = ~5 GB per day`
`5 GB * 365 days = ~2 TB per year`

Since there are not many relationships involved and the volume of data is going to be significant, we probably want to lean towards a NoSQL database because:
- They can scale horizontally.
- They are optimized for write operations.

However, we still need a table-like structure, complex querying capability, and a relationship between URLs and users. So, a Document DB is the most appropriate type of NoSQL database.

[Azure CosmosDB](https://learn.microsoft.com/en-us/azure/cosmos-db/) is generally the Document DB of choice on Azure, so we will roll with that.

![Storing a Short URL](/assets/diagrams/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener/1.png)\
**Figure: Architecture for storing the short URLs**

### 3. How will we generate the URLs?
To generate a URL, we need a unique ID that replaces the original URL. The client has mentioned they would like it short but are open to your recommendation on how long it should be.

#### 3.1 How many digits?
For this part, some simple maths should give you a good answer. We want to calculate how many IDs can be created for a given length. Ideally, a significantly large number of URLs will last us well into the future.

The client doesn't care how readable it is, but assuming people will be using these URLs, it should still be relatively easy to process visually. For that reason, it's best to limit the ID to alphanumeric characters.

We could use base36 (0-9 and a-z) or base62 (0-9, a-z and A-Z) for encoding.\
**Base36 Advantage:** It's easier to enter only lowercase letters when typing a URL.\
**Base64 Advantage:** We can possibly have a shorter key because it gives more permutations.

We will go with base36, but both are valid options and exploring other encoding types is also valid.

Let's roughly calculate the permutations for base36 with different length keys:

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

We can discard 6 immediately; running out in less than a year is unacceptable.

We can also discard 9, as 8 gives us 821 years, which is more than we will ever need, so going to 9 makes the URL longer without much upside.

It's between 7 and 8. 7 could be adequate since 21 years is a long time, and we could revisit the problem later. However, if we underestimate the number of daily users, things could get out of hand. Additionally, we know we will hit a wall eventually.

Since an extra character isn't the biggest deal, 8 is a better choice because we won't run out even if daily use is significantly more than expected.

#### 3.2 How to handle custom IDs?
Users also need the ability to add a custom ID. 

That's relatively easy: check the database for the existence of that key, and if it doesn't exist, allow them to create it.

Note that this URL could be of any size, but that doesn't matter since the user defines it. However, you need to check for validation issues because some characters may not be supported.

#### 3.3 How to generate the keys?
There are a few options to consider when generating the keys.

**Sequentially:** We could generate the keys by sequentially iterating to the next value.\
**Problem:** This would violate the non-functional requirement around making the URL challenging to guess.

**Random Generation**: We could randomly generate each digit in the key.\
**Problem:** The more keys we generate, the more chance of a duplicate occurring, slowing down the service as duplicates must be handled.

**Hashing:** We could use a hashing algorithm (e.g. MD5) to create a hashcode based on the URL and take the first 8 digits.\
**Problem:** It's still relatively likely that a duplicate key will occur, and we will need to handle that problem. For example, we could increment a number every time a collision occurs, append that to the long URL, and repeat the hashing process until the key is unique

**Key Generation Service (KGS)**: Creating a service that runs in the background helps eliminate many of the shortcomings of the previous 3 solutions. The service creates unique keys and stores them in preparation for use by the URL shortener.\
**Problem:** This solution introduces additional cost and complexity. We now need to maintain the service and ensure it is highly available so that it is not a single point of failure.

There are other solutions to this problem, but as you can see, each solution has a trade-off.

We will adopt the KGS for our solution. It is a robust but complex solution.

To make the service work, we will need a service like [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-csharp) to create keys.

We will also need a way to store our keys; this can be done in [Azure Cosmos DB for Table](https://learn.microsoft.com/en-us/azure/cosmos-db/table/introduction). Cosmos DB is guaranteed to be 99.9% highly available out-of-the-box, but we can increase that to 99.99% with a different replication strategy.

![Generating Keys for Short URLs](/assets/diagrams/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener/2.png)\
**Figure: Architecture for the Key Generation Service**

### 4. How do we ensure high availability?

We've already covered some aspects of high availability in this architecture. There are 2 more crucial concepts we need to include:
- Data Partitioning
- Caching

#### 4.1 Data Partitioning
We want to scale our URL database horizontally. Luckily, Cosmos DB supports partitioning out of the box.

When we retrieve our long URLs, we always provide short URLs. For this reason, we can partition based on the [id we generated for our short URL](https://learn.microsoft.com/en-us/azure/cosmos-db/partitioning-overview#use-item-id-as-the-partition-key). Simple!

#### 4.2 Caching
Generally, with URLs, a small portion of viral ones receive most of the traffic. It would be awesome to cache these URLs to reduce the load on the rest of the system.

Using the [Cache Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside) with a least-recently-used eviction policy should naturally lead to the most frequently accessed items being cached.

[Azure Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-overview) is the right tool for this job.

![Caching frequently used URLs](/assets/diagrams/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener/3.png)\
**Figure: Architecture for caching URLs that are often used**

### 5. How can we optimize the deletion and archival of URLs?
While many URLs live forever, we know there are a few situations where URLs are archived or deleted.

#### 5.1 Archived URLs
The first is when the creating user sets an expiry time. When the expiry time is reached, the system can ensure that requests for the URL notify the requesting user that it has expired. Manually archived URLs can be treated the same as ones with expiry times; we just set the expiration time to when the archive was requested.

The archived URLs can remain in the database so the creating user can revisit and see archived URLs. So we don't need any architectural changes. We might want to make database changes to free up the keys of the archived URLs, but our system has such a large volume of keys available that we can accept this as a trade-off. 

#### 5.2 Deleted URLs
Deleting URLs is a much more destructive action, and it's also likely to happen more rarely than other actions in the system. We want to ensure that the deleted URLs are completely removed from the system.

Despite this, we don't need any significant architectural changes. All we have to do is delete the URL from the URLs database. Again, we could worry about freeing up the keys, but this would introduce architectural complexity for little benefit since we have many keys available.

### 6. How do we track the analytics?
Analytics was optional for the client, so you want to address it last. However, it's still worth digging into as it involves significant extra complexity.

Before we jump in, an assumption is that we are crafting analytics for our client rather than for the creators of URLs. Make sure to double-check that with the client before architecting!

There are a few factors to consider in designing our analytics service:
- We need an efficient way to query insights about our data. 
- We may need to store data in a different schema to optimize reporting analytics.
- It does not need to be real-time

Our existing URLs database is designed for quick read/write of individual URLs rather than for querying insights about a group of URLs. For this reason, there are better options.

So we need a data solution. In Azure, there are many ways to architect a data solution. We are going with a simple-to-understand one, [Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/). We will need: 
- [Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-overview) for ingesting and transforming the data.
- [OneLake](https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview) to store the data while we process it
- [Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/) to store data that has been transformed.
- [PowerBI](https://learn.microsoft.com/en-us/power-bi/fundamentals/power-bi-overview) for visualizing the data

Our Data factory can retrieve analytics on a schedule and store the data in OneLake while it transforms the data to send to our structured data warehouse. PowerBI then reads from the data warehouse to create beautiful analytics reports.

Note that Fabric is a SaaS product, so we don't need to manage these resources in Azure. It's all done from within Fabric!

![Analytics Architecture](/assets/diagrams/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener/4.png)\
**Figure: The analytics architecture**

## Phase 3 - Communicating the Sauce
Now that you've got a nicely designed system, you want to put it together as an excellent deliverable for your client.

You want to ensure you stay at a high level and stick to the significant business value delivered in each part. To assist, you will want a nice overview diagram showing how all the pieces fit together. Here's one for our system:

![Architecture Overview](/assets/diagrams/2024-06-09-System-Design-in-Azure-for-Clients-URL-Shortener/5.png)\
**Figure: High-Level Architecture Diagram**

You'll also want to come prepared with a concise list of benefits. Here's one for our system:
- Highly scalable - each mechanism in the chain has been designed with horizontal scaling in mind.
- Highly available - All our components support high availability, so there should be minimal downtime issues.
- URLs will be challenging to guess. They are random.
- All functional requirements satisfied - including optional analytics

It would be best if you also highlighted some of the deficiencies. No architecture is perfect, and you want the client to understand the trade-offs. Here's some for our system:
- Maintenance - It's a highly complex solution requiring lots of maintenance.
- Expensive - There are a lot of 3rd party cloud services here, so it's likely to be costly to run.
- Readability - The short URLs are random letters and numbers. They are short but could be more readable.
- Security - We haven't factored in users limiting access to a short URL.

As a final note, remember to [cater to your audience](https://www.ssw.com.au/rules/catering-to-audience/); if you're talking to a Tech Lead, you can get way more into the technical details than when talking to a CEO.

## References
Here are some of the main resources I used to understand this topic:
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Microsoft Fabric Documentation](https://learn.microsoft.com/en-us/fabric/)
- [Design Gurus Course](https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b5dac93e7ae59a1af6b)
- [System Design School Course](https://systemdesignschool.io/problems/url-shortener/solution)
- [Educative.io Course](https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers/design-and-deployment-of-tinyurl)
- [Alex Xu's System Design Book](https://www.amazon.com.au/System-Design-Interview-insiders-Second/dp/B08CMF2CQF)
- [ByteByteGo Website](https://bytebytego.com/)
