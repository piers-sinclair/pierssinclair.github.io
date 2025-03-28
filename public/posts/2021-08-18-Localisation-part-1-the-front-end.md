---
layout: post
title:  "🌏 Localisation Part 1 - The frontend using React Redux and react-i18next"
date:   2021-08-18 12:52:53 +1000
categories: china-market
author: Piers Sinclair
published: true
---
<p align="center" width="100%"><img src="/assets/images/2021-08-18-Localisation-part-1-the-font-end/ChineseToEnglish.png" /></p>

Commonly, companies implement their websites wholly in their native language without considering the extensibility of this approach in the future. When they later need to expand into another market, it becomes a massive job to enable multi-language support across the website. Planning for this problem in advance can make the process of adding new languages much less painful 🤕.

At the most basic level, two different parts of the application need to be localised. Firstly, the frontend, that involves all of the static content on the page. Secondly, the backend, where all dynamic content is stored. 

Today, I will take you through the former by showing you how you can localise your React applications using the react-i18next library.

# Setup

Before we begin, we need to install the [react-i18next package](https://react.i18next.com/).

```javascript
npm install react-i18next i18next i18next-browser-languagedetector --save
```

I also recommend you update TypeScript to the latest version since I had some troubles with an older version of TypeScript

```javascript
npm install typescript@latest
```

# Configuring React i18next

Now that you've got the right libraries, the next step is to set up the configuration and resources necessary for react-i18next.

First, we need a configuration file called `i18n.ts` that goes in `ClientApp/src/i18n/`

In this case, I am configuring Chinese and English. You can also configure different namespaces. To keep it simple, I am starting with two namespaces, "General" and "Home", my configuration looks like the below:

#### /ClientApp/src/i18n/i18n.ts
```javascript
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

In addition to the configuration file, we also need to add the translation files themselves. You will need a different translation file for each namespace and language used. These files contain a common variable that is used to denote different translations. For example, you might have a variable named "websiteTitle" that has the page's title in English, Chinese and any other language you support.

I have four translation files named and stored as follows.

```
/ClientApp/src/i18n/en_us/general.json
/ClientApp/src/i18n/en_us/home.json
/ClientApp/src/i18n/zh_cn/general.json
/ClientApp/src/i18n/zh_cn/home.json
```

You should see the name and folder structures of these files correspond with the configuration file i18n.ts

Here's what they look like:

#### /ClientApp/src/i18n/en_us/general.json
```json
{
  "websiteTitle": "China Dev Blog",
  "home": "Home",
  "userProfile": "User Profile",
  "language": "English"
}
```
#### /ClientApp/src/i18n/en_us/home.json
```json
{
    "body": "Welcome to my blog website about China integration!"
}
```
#### /ClientApp/src/i18n/zh_cn/general.json
```json
{
    "websiteTitle": "中国软件开发博客",
    "home": "首页",
    "userProfile": "用户资料",
    "language": "中文"
}
```
#### /ClientApp/src/i18n/zh_cn/home.json
```json
{
    "body": "欢迎来到我创建关于中国整合资讯的网页！"
}
```

# Using our new translations

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

After that, I had to define WithTranslation in my props, and then I was good to go. I changed it from

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

Well it's simply a matter of calling the props, below you can see I am accessing the General and Home namespaces from within my render function to retrieve different translation values:

```javascript
{this.props.t('General:home')}
{this.props.t('Home:body')}
```

You should see these show up as the default language from the i18n.ts configuration file we set up earlier.

# Switching language

Changing language is super easy. Just call `this.props.i18n.changeLanguage('en_us');` where the parameter is one of the cultures you have defined in your configuration file.

For example, to switch to Chinese in my implementation, I call:

```javascript
this.props.i18n.changeLanguage('zh_cn');
```

# Adding a language dropdown

To make switching language easy, I implemented a dropdown component using Ant Design (see [my blogpost](https://www.piers-sinclair.com/china-market/2021/07/21/Getting-Started-With-Ant-Design.html) for more info on Ant Design). 

It displays the current language in the dropdown, changing according to what the user has chosen. When the dropdown is clicked, all languages are displayed without a translation to make it easier for people to navigate when they have clicked on a language they don't understand.

#### /ClientApp/src/components/LanguageDropDown.tsx
```javascript
import * as React from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { Menu, Dropdown, Button } from 'antd';
import { GlobalOutlined, DownOutlined } from '@ant-design/icons';

type LanguageDropDownProps =
    WithTranslation;

class LanguageDropDown extends React.PureComponent<LanguageDropDownProps> {

    public handleMenuClick(key: string) {
        const { i18n } = this.props;

        switch (key) {
            case "1":
                i18n.changeLanguage('en_us');
                break;
            case "2":
                i18n.changeLanguage('zh_cn');
                break;
            default:
                i18n.changeLanguage('en_us');
                break;
        }
    }

    public render() {
        const { t } = this.props;

        return (
            <Dropdown
                overlay={
                <Menu onClick={(e) => this.handleMenuClick(e.key)}>
                    <Menu.Item key="1">
                        English
                    </Menu.Item>
                    <Menu.Item key="2">
                        中文
                    </Menu.Item>
                </Menu>
            }>
                <Button>
                        <GlobalOutlined />
                        {t('General:language')}
                        <DownOutlined />
                </Button>
            </Dropdown>
        );
    }
}

export default withTranslation(['General'])(LanguageDropDown as any);
```

Here's what it looks like set to English:

![Website translated to English](/assets/images/2021-08-18-Localisation-part-1-the-font-end/set_to_english.png)
**Figure: The dropdown set to English**

And now when we switch to Chinese:

![Website translated to Chinese](/assets/images/2021-08-18-Localisation-part-1-the-font-end/set_to_chinese.png)
**Figure: The dropdown set to Chinese**

Awesome right🌟? Now you can put this dropdown somewhere suitable on your application and switch languages at will!

You can view my website source code at [China Dev Blog](https://github.com/pierssinclairssw/China-Dev-Blog)