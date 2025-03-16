---
layout: post
title: 📖 Writing Great User Stories
date:  2024-03-15 01:00:00 +1000
categories: dotnet
tags: agile, scrum, project-management
author: Piers Sinclair
published: false
---

Imagine you're a developer assigned a user story that says: "Add pay button to shopping cart." What could go wrong? You might think it's not a big deal, but you'd be surprised at the negative impacts.

User stories are the backbone of any project, yet teams often fail to give them the right time, care and attention to detail to produce outstanding outcomes. Poor user stories lead to a host of problems, including:
- Increased time waste as developers are unclear about expectations
- Lack of alignment between the business and developers
- Gaps in requirements being missed

There are three things I recommend doing to avoid these issues:
1. Spend time fleshing out the details
2. Spend time condensing details to the bare minimum
3. Get buy-in from the key business stakeholders AND the developers

## 1. Spend Time Fleshing Out The Details
Too often, I see a user story with only a title or some small scribbled notes in the description. Here's an example:

| **Title** | Add pay button to shopping cart |
|---------------------|------------|
| **Description** | We need a button to pay. |

It sounds simple. But there are so many missing details. 
- Where should the button go? 
- What colour should the button be? 
- What text should the button have? 
- Which page is the shopping cart?
- Should the button have the functionality to pay, or is that another ticket?

It's crucial to spend time as a team figuring out the details. Failure to do so will confuse the team and result in significant rework.

### 1.1 What Details Are Required?

Generally, I follow a pattern with user stories of dividing them into sections:

- Description
- Acceptance Criteria
- Screenshots (if relevant)
- More Context

#### 1.1.1 Description
The description is the problem statement. It should contain no more, no less.

#### 1.1.2 Acceptance Criteria
Acceptance criteria are the contract between the developer and the business. They outline all expectations. Anything not covered in the acceptance criteria should not be expected to be completed.

#### 1.1.3 Screenshots (if relevant)
Screenshots are a powerful storytelling tool if the functionality being built affects the UI. As the old proverb says, "A picture is worth a thousand words."

#### 1.1.4 More Context
The description and acceptance criteria should be kept clean because they are the developers' first port of call when they want to understand the task's expectations. However, additional details, like notes or gotchas, are often not part of the problem statement or contract. It's a good idea to avoid adding these details to the description and acceptance criteria because they reduce the team's ability to understand the issue quickly.

Let's revisit our example with all of these details filled out:

| **Title** | Add pay button to shopping cart |
|---------------------|------------|
| **Description** | On [piers-sinclair.com/shopping-cart](https://piers-sinclair.com/shopping-cart)<br> we need a button to pay. <br><br>The button should look like the screenshot below. |
| **Acceptance Criteria** | **AC1:** The button matches the design in the mockup below.<br> **AC2:** The button displays the standard success/failure message on click.<br> **AC3:** The button displays the standard processing indicator during background work.<br> **AC4:** The button calls the payment process from user story #123. |
| **Screenshots** | ![Figure: The new pay button to be added.](/assets/images/2025-03-15-Writing-Great-User-Stories/1.png) |
| **More Context** | - We previously implemented a similar payment button for individual items. See user story #124<br> - Taylor knows a lot about this topic as they architected the payment process. |


Notice how much clearer the expectations are? Imagine a developer implementing the first one compared with the second one. With the first one, at best, they have a lengthy call with the Product Owner to understand the requirements, and at worst, you end up with something completely different from the expected outcome!

### 1.2 How can you ensure time is dedicated to this process?
The above process sounds logical, but reality often gets in the way. Distractions occur, and it's too easy for an unrefined story to slip through the cracks. I recommend avoiding this issue by embedding the process into your planning and refinement.

How can we do that? We can mandate that no ticket should go into Sprint until the entire team approves it. To facilitate this approval, add a "ready" tag, which indicates that the team has fully refined this user story and everyone agrees it has all the details required to be worked on. Then, when it comes to Sprint Planning, if a user story has no "ready" tag, it either has to be refined before being put in the Sprint, or it is not allowed to be added to the Sprint. Building this "ready" tag into backlog refinement meetings is also helpful. When you do refinement, take the next few highest-priority user stories from the backlog and refine them until they can have the ready tag. Not only will this improve the user stories, but it will also improve the flow and clarity of the backlog and its ceremonies.

### 1.3 How can adherence to these processes be enforced?
Adhering to the above can be difficult. It requires a strong will and complete buy-in from the team. The process will fail if you start letting in user stories that don't meet the "ready" tag. That's why the best approach is to get aligned with everyone on the team about this tag and encourage everyone to speak up if a "ready" tag is inappropriate. In particular, the Product Owner and Scrum Master should take careful lead to check in with all team members about a user story and ensure that no user stories are flying under the radar.

## 2. Spend time condensing details to the bare minimum
Incorporating processes that flesh out user stories can be a huge time sink, especially when the whole team needs to give buy-in. That's why it's crucial to create concise user stories. Unfortunately, it is typical for a user story to contain many irrelevant details, making reading it a cognitive nightmare. Here's an example:

| **Title** | Add logic for paying for the items requested by a user when the user presses a payment button on the website  |
|---------------------|------------|
| **Description** | GIVEN I am a user of piers-sinclair.com<br>WHEN I want to pay for a specific set of items<br>AND I press any pay button on piers-sinclair.com<br>THEN the system should have logic to process my payment by summing all the items requested according to the process architected by Taylor in #125<br>AND the user's card should be charged with the value calculated from the payment process. |
| **Acceptance Criteria** | **AC1:** Payments are processed according to Taylor's design in #125. This design was created as part of the initial focus groups conducted with users. <br>**AC2:** The payment process is generic and could be applied in many different places across the system   |

### 2.1 Keep it concise
The team should start writing a user story with a concise definition. In doing so, the team will understand what's expected in the user story quicker, saving time during refinement and development as the user story is revisited. A bit of extra effort upfront to make a concise user story saves exponentially more effort in understanding it later.

### 2.2 What to look out for?
There are several things to look out for when streamlining user story descriptions. Foremost are redundant words. The team should reduce the description to as few words as possible without losing meaning. That's also why the "more context" section is necessary. The description should convey the problem as lean as possible, but sometimes there is valuable information that helps implement the feature but isn't directly relevant to the problem. There is far more leeway for lengthy content in "more context" because the developer will already understand the problem statement and acceptance criteria. 

Another thing I like to remove is patterns like Given-When Then. In my experience, these patterns often add little value to a user story, increase cognitive load, and are used as crutches for writing poor user stories. I have found that because it is an inflexible pattern, it forces the writer down a path unsuitable for every user story. For example, how often is the "Given" part useful? It frequently results in meaningless phrases like "Given I am a customer of the system". I suspect this might be a controversial viewpoint, but I believe most user stories can be conveyed concisely using plain English.

Let's see how we can improve the example from earlier:

#### 2.2.1 Title
From
> Add logic for paying for the items requested by a user when the user presses a payment button on the website

To
> Add payment logic for requested items

We've removed references to the user, buttons, and website because they aren't particularly relevant to the process.

We've kept the requested items because it indicates that the payment relates to a set of items provided by the system.

#### 2.2.2 Description
From
> GIVEN I am a user of piers-sinclair.com<br>WHEN I want to pay for a specific set of items<br>AND I press any pay button on piers-sinclair.com<br>THEN the system should have logic to process my payment by summing all the items requested according to the process architected by Taylor in #125<br>AND the user's card should be charged with the value calculated from the payment process. 

To
> When payment is requested for items, we need to implement the logic defined by Taylor in #125

- We have removed Given-When-Then because it added significant complexity. 
- We have removed several redundant or unnecessary words. 
- We have removed references to the user's card because this is an unnecessary extra detail that is implied.

#### 2.2.3 Acceptance Criteria
From
> **AC1:** Payments are processed according to Taylor's design in #125. This design was created as part of the initial focus groups conducted with users. <br>**AC2:** The payment process is generic and could be applied in many different places across the system.

To
> **AC1:** Payments are processed according to Taylor's design in #125. <br>**AC2:** The payment process is reusable system-wide.

We've removed redundant words and the part about focus groups. This part isn't particularly relevant to acceptance criteria, but it could be helpful context so we can move it to more context.

Here's the final product:

| **Title** | Add payment logic for requested items |
|---------------------|------------|
| **Description** | When payment is requested for items, we need to implement the logic defined by Taylor in #125 |
| **Acceptance Criteria** | **AC1:** Payments are processed according to Taylor's design in #125. <br>**AC2:** The payment process is reusable system-wide.  |
| **More Context** | Taylor's design was created from user focus groups.  |

Isn't that easier to read?

## 3. Get buy-in from the key business stakeholders AND the developers
Having well-written user stories is only half the battle. They mean the team can now easily understand and execute user stories. However, alignment between the business and developers is an absolute must to ensure a truly effective team. There are two sides to this story.

### 3.1 The Business Side
Business personnel (e.g. the Product Owner) are responsible for ensuring that all their requirements have been covered and resolving any questions the engineering team might have about expectations and functionality. Acceptance criteria and availability are the two fundamental pillars here. 

#### 3.1.1 Acceptance Criteria
Acceptance criteria form the contract between the engineers and the business. The Product Owner needs to ensure that all expected changes are documented in the acceptance criteria, no matter how small. If the acceptance criteria are missing key expectations or contain irrelevant information, they will undermine their credibility and cause the team to avoid trusting the user stories assigned to them. 

It's also unrealistic to expect the acceptance criteria to be immovable. That's why it is crucial to communicate changes to the team verbally and through comments on the user story. The user story acceptance criteria should also be changed to reflect the *current understanding*, removing all references to the previous understanding.

#### 3.1.2 Availability
Availability is another key factor for business personnel. The engineers will almost certainly discover unexpected roadblocks, missing details, or new improvements. When they stumble upon these, the business personnel must be there to answer questions; otherwise, the developers will be blocked or risk implementing something that isn't aligned with the business.

### 3.2 The Development Side
Developers have the following responsibilities for ensuring alignment with the business:
- Understanding and Documenting
- Speaking up

#### 3.2.1 Understanding and documenting
Developers should ensure they fully understand and document expectations for a user story before adding it to the Sprint. It's too easy to ignore user stories until they appear in the Sprint, which can cause all sorts of dysfunctions. 
- What if there are missing requirements that you identify through your technical lens?
- What if the business has not considered all technical problems or effort required?
- What if it's not technically possible, or a spike is required to investigate options?
- What if there are blockers preventing work on this user story?

The developer should seek to understand the technical requirements and the business process that ties into the feature. If a developer does not understand the business case of what they are implementing, they cannot hope to implement it correctly or identify potential problems with the proposed implementation.

Through understanding the user story and documenting all requirements, the developer gains clarity on what exactly is required and has evidence to support their case if requirements change. This documentation leads to greater alignment, happier business staff and developer protection.

#### 3.2.2 Speaking up
It's impossible to anticipate every feature's requirements and pitfalls upfront. Developers gain a unique, detailed perspective of a feature when implementing it. Engineers must speak up when they see an issue, roadblock, or new idea. 

By flagging problems with the business, developers achieve better outcomes, create credibility with the business and build trust with the business stakeholders. Conversely, the developer who doesn't speak up may see their feature done quicker, but it will result in significant technical debt, something the business did not expect, or a feature that is much worse than it could have been. Ultimately, the business will notice these issues over time and lose faith in the developer's work.

### 3.3 Pulling Together The Business And Development
So far, the responsibilities of business stakeholders and developers have been established. But how can those responsibilities be aligned? This alignment is where the "ready" tag again comes in handy. By having a strong advocate for the "ready" tag and strictly following its principles, the team will build alignment naturally before the Sprint.

In addition to the "ready" tag, a post-completion handshake can do wonders for ensuring alignment. Developers should seek to demonstrate their feature to the Product Owner so they can get feedback and check that it meets all requirements. Any changes can be made as a new user story. Yet, the process shows that the developer cares about the work, and the product owner gets the opportunity to ensure the feature meets their expectations.

## 4. Summary

Writing good user stories is a challenging, time-consuming process that requires strong willpower to execute well. Yet, when done poorly, it can have disastrous consequences for a software team.

Key advocates on the team must champion fully fleshing out the details of user stories, keeping them as concise as possible, and ensuring alignment among the business and engineers. With the proper guidance, teams can transform themselves from an inefficient mess to a well-oiled machine.

Will you be the advocate who transforms your team's user stories?