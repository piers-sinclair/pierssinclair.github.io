---
layout: post
title:  🧩 Durable .NET - The Dry Trap
date:   2024-12-12 01:00:00 +1000
categories: dotnet
tags: clean-code, dry, wet, solid, object-oriented-programming, oop
author:
- Piers Sinclair
published: true
---

I often see the concept of Do Not Repeat Yourself (DRY) championed as the most important concept for software engineers to follow.

It's true that where possible you want to reduce duplication in code to avoid maintaining the same logic in multiple places, and potential synchronization issues.

Unfortunately, this concept is promoted so religiously that it causes a dangerous situation to occur. Engineers start looking to apply this concept to everything, everywhere no matter the cost.

The problem of course, is that when misused DRY causes more headaches and is more dangerous than any duplicated code that could occur in a system.

At this point you might be wondering what could possibly be the problem with reducing duplication?

The answer as usual comes back to tight coupling, separation of concerns and SOLID.

By trying to apply DRY to 2 sets of logic which are seemingly similar but actually represent different logical flows you fall into the trap of coupling those 2 logic flows together.

Let's take a look at a few examples.

### Scenario #1 - The Person Class

Let's say we are building a system that models a company selling different products. To represent a product we have a `Product` class:

```csharp
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

There are 3 classes inheriting from `Product`:
- `PhysicalProduct`
- `DigitalProduct`
- `Service`

Here's what they look like:

```csharp
public class PhysicalProduct : Product
{
    private const decimal _salesTaxModifier = 1.1M;
    public Decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

```csharp
public class DigitalProduct : Product
{
    private const decimal _salesTaxModifier = 1.1M;
    public Decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

```csharp
public class Service : Product
{
    private const decimal _salesTaxModifier = 1.1M;
    public Decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

Now a clever engineer might come along and go "Hey, that's a lot of duplication! Let's move `GetSellPrice` and _salesTaxModifier into the Product base class.". The engineer goes ahead and does this, and refactors the method into 1.

```csharp
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    private const decimal _salesTaxModifier = 1.1M;
    public Decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}

At first glance it looks like a great idea, the logic is identitical. The problem is that while the logic is the same right now, it's unlikely to remain the same because it has a logically different purpose. There is no guarantee that a product's price will always remain the same among all product types.

Let's say it's been 6 months and the `GetSellPrice()` function has been used gratuitously in 100s of places in the code. Now the business comes to us and says "We would like our digital products and services to have a 5% discount applied across the board to encourage our users to purchase them over physical products".

The engineer looks at the code and decides to add an if statement into the function:

```csharp
private const decimal _salesTaxModifier = 1.1M;
private const decimal _discount = 0.95M;
public Decimal GetSellPrice()
{
    var sellPrice = Price * _salesTaxModifier;
    if(this is DigitalProduct || this is Service)
    {
        sellPrice = sellPrice * _discount; 
    }
    return sellPrice;
}
```

The logic is already more complex, but it's not the end of the world.

Now let's imagine it's 3 months later and a new law is passed which means sales tax does not apply to services.

The engineer adds another condition to their function:

```csharp
private const decimal _salesTaxModifier = 1.1M;
private const decimal _discount = 0.95M;
public Decimal GetSellPrice()
{
    decimal sellPrice;
    if(this is Service)
    {
        sellPrice = Price;
    }
    else
    {
        sellPrice = Price * _salesTaxModifier
    }

    if(this is DigitalProduct || this is Service)
    {
        sellPrice = sellPrice * _discount; 
    }

    return sellPrice;
}
```

The logic is pretty complex now, each product has a distinct flow and it is confusing to debug what is going on.

Now let's say the business asks for a new product class `Subscription` and they want to offer 

Hopefully you can see that each type of product generally has a different logical flow even though when we started it looked very similar.

For this reason it's better to keep the function local to each product, and this is also a good reason for the Product Class to be an interface. It often causes more problems than it's worth to share business logic through inheritance. Here's how it would look:

```csharp
public class IProduct
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    
    private const decimal _salesTaxModifier = 1.1M;
    public Decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}

When a customer wants to purchase a product they need to get the price and both `PhysicalProduct` and `DigitalProduct` have a `GetSellPrice` function to retrieve the price.

This is where it's


