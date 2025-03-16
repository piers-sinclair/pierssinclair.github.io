---
layout: post
title: 📖 Writing Good User Stories
date:  2024-03-15 01:00:00 +1000
categories: dotnet
tags: agile, scrum, project-management
author: Piers Sinclair
published: false
---

User stories are the backbone of any project, and yet often teams fail to give them the right time, care and attention to detail that produces truly great outcomes. Poor user stories lead to a host of problems including:
- Increased time waste as developers are unclear about expectations
- Lack of alignment between the business and developers
- Gaps in requirements being missed

There are 3 things I recommend doing to avoid these issues:
1. Spend time fleshing out the details
2. Spend time condensing those details to the bare minimum
3. Get buy-in from the key business stakeholders AND the developers

## 1. Spend Time Fleshing Out The Details
Too often, I see a user story which has only a title, or it has some small scribbled notes in the description.

It's crucial to spend time as a team figuring out what the details are. Failure to do so will cause confusion amongst the team and result in significant rework.

### 1.1 What Details Are Required?

Generally, I follow a pattern with user stories of dividing it into sections:

- Description
- Acceptance Criteria
- Screenshots (if relevant)
- More Context

#### 1.1.1 Description
This is the problem statement, it should contain no more, no less.

#### 1.1.2 Acceptance Criteria
This is the contract between the developer and the business, it outlines all expectations. Anything not covered in the acceptance criteria should not be expected to be completed.

#### 1.1.3 Screenshots (if relevant)
If the functionality being built affects the UI, then screenshots are a powerful story telling tool. As the old proverb says "A picture tells a thousand words".

#### 1.1.4 More Context
The description and acceptance criteria should be kept clean because they are the developers first port of call when they want to understand the expectations in the task. However, there are often additional details that are not part of the problem statement or contract, like notes or gotchas. It's a good idea to avoid adding these details to the description and acceptance criteria because they reduce the team's ability to quickly understand the issue.

### 1.2 How can you ensure time is dedicated to this process?
The above process probably sounds logical, but sadly reality often gets in the way. Distractions occur and it's all too easy for an unrefined story to slip through the cracks. To avoid this issue I recommend embedding the process into your planning and refinement processes.

How can we do that? By creating a rule that no ticket should go into the Sprint until it has been approved by the entire team. To faciliate this approval add a "ready" tag which indicates that the team has fully refined this user story and everyone agrees it has all details required to be worked on. Then when it comes to Sprint Planning if a user story has no "ready" tag it either has to be refined before being put in the Sprint or it is not allowed to be added to the Sprint. It's also helpful to build this "ready" tag into backlog refinement meetings. When you do refinement simply take the next few highest priority user stories from the backlog and refine them until they can have the ready tag. Not only will this improve the user stories, but it will also improve the flow and clarity of the backlog and it's ceremonies.

### 1.3 How can adherehance to these processes be enforced?
Adhering to the above can be difficult. It requires a strong will and complete buy-in from the team. If you start letting user stories in which don't meet the "ready" tag, the whole process will fall down. That's why the best approach is to get aligned with everyone on the team about this tag and encourage everyone to speak up if a "ready" tag is not appropriate. In particular, the Product Owner and Scrum Master should take careful lead to check-in with all team members about a user story and ensure that no user stories are flying under the radar.

## 2. Spend time condensing those details to the bare minimum
Following processes that flesh out user stories can cause a huge time sink, espescially when the whole team needs to give buy-in. That's why representing user story information concisely is so crucial. Unfortunately, it is all to common for a user story to contain far too many irrelevant words and details that make reading it a cognitive nightmare.

### 2.1 Keep it concise
It's vital that as the team writes a user story they start with a concise definition with as few words as possible. In doing so, the team will be able to understand what's expected in the user story quicker saving time getting alignment from others. It will also reduce time spent understanding the user story during development as the engineer revisits the user story requirements. A bit of extra effort upfront to make a concise user story saves exponentially more effort understanding the ticket later.

### 2.2 What to look out for?
There are several things to look out for when trying to streamline user story descriptions. Foremost are redundant words. The team should try to reduce the description to as few words as possible without losing meaning. That's also why the "more context" section is important, the description should convey the problem as lean as possible but sometimes there is valuable information that helps implement the feature but isn't directly relevant to the problem. There is far more leeway for lengthy content in "more context" because the developer will already have a clear grasp on the problem statement and acceptance criteria. 

Another thing I like to remove is patterns like given when then. In my experience, these patterns often add little value to a user story, increase cognitive load and are used as a crutch for writing poor user stories. I suspect this might be a controversial viewpoint, but I believe that most user stories can be conveyed in a far more concise manner using plain english.




## 3. Get buy-in from the key business stakeholders AND the developers