---
layout: post
title:  "🧧 Getting started using Ant Design with ASP.NET Core, React and Redux"
date:   2021-07-12 12:52:53 +1000
categories: jekyll update
published: false
---
China has a vastly different array of technologies that are used daily. One of the most popular libraries in recent years has been [Ant Design](https://ant.design/). Ant Design is a set of UI components designed by Alibaba for the React ecosystem. The great thing about Ant Design is that it has a robust set of components and is very comprehensively documented in both English and Chinese!

Today I'm going to take you through the initial experience I have had getting Ant Design up and running. For this example, I have built a small React app based on the Microsoft ASP.NET Core + React + Redux template that comes packaged with Visual Studio.

![ASP.NET Core + React + Redux](/assets/images/2021-07-12-Getting-Started-With-Ant-Design/ReactReduxTemplate.png)
**Figure: The Visual studio template I used**

From there I have added a simple User Profile component for displaying dummy user information. Here is the code I started with in the UserProfile component:

<script src="https://gist.github.com/pierssinclairssw/20bf24524051c1164de80cb69f7b5758.js"></script>

Here's what this looks like without any styling:

![Initial user profile](/assets/images/2021-07-12-Getting-Started-With-Ant-Design/snippet-of-original-blog.png)
**Figure: The initial user profile with no styling**

Functional, but not very pretty!

# Install AntD

Before we can begin making our profile pretty using Ant Design, we first need to install it. Simply run:

`npm install antd`

# Add a Card

To start out, let's add a card which will improve the layour of our profile. First let's import the card library and the Ant Design stylesheet.

```
import { Card } from "antd";

import 'antd/dist/antd.css';
```

Now to use it, we can simply reference it like a normal React component. Super easy!

# Populating the card

Let’s start out simple and add a card that has a title and some info about us. Jump into the user profile component and replace the react fragment tsx with the following:

```
<Card title={this.props.userProfile.FirstName + " " + this.props.userProfile.Surname}>

    {this.props.userProfile.JobTitle}<br />

    {this.props.userProfile.Description}

</Card>
```

It should look something like this:

![Initial user profile](/assets/images/2021-07-12-Getting-Started-With-Ant-Design/snippet-of-base-card.png)
**Figure: Our brand new card!**

# Adding images

To make our profile look more professional, we probably want to add a cover photo and avatar. The cover photo is easy, simply add the cover attribute to the card and reference an image in your repository:

`cover={<img alt="example" src={require('../images/piers-cover.jpg')} className="cover-photo" />}`

I've also added some rudimentary css to limit the height of the card and make it similar to a banner:

```
.cover-photo {
    max-height: 312px;
    object-fit: cover;
    object-position: 0 0;
}
```

The avatar is a little more difficult because we need to use something on the card called the Meta property. Cards use this property to give greater flexibility around meta data placement. To use the Meta property define it in a constant as follows:

`const { Meta } = Card;`

Let's also import the avatar library while we are at it:

`import { Card, Avatar } from "antd";`

Now that we have the Meta property we can introduce it into our card in any location we want. Let's put it at the top and move our name and job title into the Meta property too. The card code should now look like this:

```
<Card
    cover={<img alt="example" src={require('../images/piers-cover.jpg')} className="cover-photo" />}>
    <Meta
        avatar={<Avatar src={require('../images/piers-avatar.jpg')} />}
        title={this.props.userProfile.FirstName + " " + this.props.userProfile.Surname}
        description={this.props.userProfile.JobTitle}>
    </Meta>
    <br/>
    {this.props.userProfile.Description}
</Card>

```

and the UI is starting to shape up nicely:

![Initial user profile](/assets/images/2021-07-12-Getting-Started-With-Ant-Design/snippet-of-cover-avatar.png)
**Figure: The card with a cover photo and avatar**

# Styling our card with Ant Design icons and actions

Now you might be wondering, how you can add some nice buttons and functionality to your card? Well Ant Design has this covered too via the actions field that adds capabilities to the bottom of a card. Additionally, the library comes with built in icons that you can use out of the box. 

Let’s import an edit and settings button to put at the bottom of the card. First import the icons we need

`import { EditOutlined, SettingOutlined } from '@ant-design/icons';`

Then add them as actions to the profile card

 ```
<Card
    cover={<img alt="profile-cover-photo" src={require('../images/piers-cover.jpg')} className="cover-photo" />}
    actions={[
        <SettingOutlined key="setting" />,
        <EditOutlined key="edit" />
    ]}> 
```

We won’t make them functional for now, but you could add functionality by simply handling the onClick event. Here's the final product:

![Initial user profile](/assets/images/2021-07-12-Getting-Started-With-Ant-Design/snippet-of-action-buttons.png)
**Figure: The slick final product**

And there we have it! As easy as 1, 2, 3 and we have a beautiful looking user profile on our website ready to be extended with further functionality.



