---
layout: post
title:  "🌏 Localisation Part 1 - The frontend using React Redux and react-i18next"
date:   2021-08-18 12:52:53 +1000
categories: china-market
author:
- Piers Sinclair
published: false
---

It is very common that companies implement their websites wholly in their native language without giving thought to the extensibility of this approach in the future. When they later need to expand into another market, it becomes a huge job to enable multi language support across the website. Planning for this problem in advance can make the process of adding new languages much less painful.

At the most basic level, there are two different parts of the application that need to be localised. Firstly, the frontend which involves all of the static content on the page. Secondly, the backend where all dynamic content is stored. 

Today I am going to take you through the former by showing you how you can localise your React applications using the React i18next library.

# Setup

Before we begin, we need to install the [react-i18next package](https://react.i18next.com/).

```javascript
npm install react-i18next i18next i18next-browser-languagedetector --save
```

I also recommend you update typescript to the latest version since I had some troubles with an older version of typescript

```javascript
npm install typescript@latest
```

# Configuring React i18next

Now that you've got the right libraries, the next step is to setup the configuration and resources necessary for react-i18next.

First we need a configuration file called i18n.ts that goes in ClientApp/src/i18n/

In our case I am configurating Chinese and English. You can also configure different namespaces, to keep it simple I am starting with two namespaces "general" and "home", my configuration looks like the below:

## ClientApp/src/i18n/i18n.ts
```
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import general_en_us from './en_us/General.json';
import general_zh_cn from './zh_cn/General.json';
import home_en_us from './en_us/Home.json';
import home_zh_cn from './zh_cn/Home.json';

export const defaultNS = 'general'
export const resources = {
  en_us: {
    General: general_en_us,
    Home: home_en_us
  },
  zh_cn: {
    General: general_zh_cn,
    Home: home_zh_cn
  }
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en_us',
    ns: ['General', 'Home'],
    resources,
    debug: true,
    interpolation: {
      escapeValue: false,
    }
  });


export default i18n;
```

In addition to the configuration file we also need to add the translation files themselves. You will need a different translation file for each namespace and language used. These files contain a common variable that is used to denote different translations. For example, you might have a variable named "websiteTitle" and that then has the title of the page in both English, Chinese and any other language you support.

I have four translation files named and stored as follows

```
ClientApp/src/i18n/en_us/general.json
ClientApp/src/i18n/en_us/home.json
ClientApp/src/i18n/zh_cn/general.json
ClientApp/src/i18n/zh_cn/home.json
```

You should see the name and folder structures of these files correspond with the configuration file i18n.ts

Here's what they look like:

## ClientApp/src/i18n/en_us/general.json
```json
{
  "websiteTitle": "China Dev Blog",
  "home": "Home",
  "userProfile": "User Profile",
  "language": "English"
}
```
## ClientApp/src/i18n/en_us/home.json
```json
{
    "body": "Welcome to my blog website about China integration!"
}
```
## ClientApp/src/i18n/zh_cn/general.json
```json
{
    "websiteTitle": "中国软件开发博客",
    "home": "首页",
    "userProfile": "用户资料",
    "language": "中文"
}
```
## ClientApp/src/i18n/zh_cn/home.json
```json
{
    "body": "欢迎来到我创建关于中国整合资讯的网页！"
}
```

# Using our new translations!

Ok, so we've got the translation configured, but how do we use our translation files?

Firstly, we need to import the new files in index.tsx so they can be used throughout our application:

```javascript
import './i18n/i18n';
```

Then It's a matter of importing react-i18next into the components we wish to translate. Import WithTranslation and withTranslation in the component you want to translate. 

```javascript
import { WithTranslation, withTranslation } from 'react-i18next';
```

Then add withTranslation and your namespaces to the export. I had some trouble getting this part to work with Redux but finally got it to work by changing from

```javascript
export default connect(
    (state: ApplicationState) => state.userProfile,
    UserProfileStore.actionCreators
)(UserProfile as any);
```

To

```javascript
const comp = connect(
    (state: ApplicationState) => state.userProfile,
    UserProfileStore.actionCreators
)(UserProfile as any);

export default withTranslation(['General'], ['Home'])(comp); 
```

After that I had to define WithTranslation in my props and then I was good to go. I changed it

From

```javascript
type UserProfileProps =
    UserProfileStore.UserProfileState
    & typeof UserProfileStore.actionCreators
    & RouteComponentProps<{ startDateIndex: string }>;
    & RouteComponentProps<{ startDateIndex: string }>
```

To

```javascript
type UserProfileProps =
    UserProfileStore.UserProfileState
    & typeof UserProfileStore.actionCreators
    & RouteComponentProps<{ startDateIndex: string }>;
    & RouteComponentProps<{ startDateIndex: string }>
    & WithTranslation;
```

# Accessing the translations

Okay, so now all the translations are sitting nicely in the component, but how do we access them?

Well it's simply a matter of calling the props, below you can see I am accessing the General and home namespaces from within my render function to retrieve different translation values:

```javascript
    {this.props.t('General:home')}
    {this.props.t('Home:body')}
```

You should see these show up as whatever you defined as the default language when you setup the i18n.ts configuration file earlier.

# Switching language

Changing language is super easy, just call this.props.i18n.changeLanguage('en_us'); where the parameter passed in is one of the cultures you have defined in your configuration file.

For example, to switch to Chinese in my implementation, I call:

```javascript
this.props.i18n.changeLanguage('zh_cn');
```

