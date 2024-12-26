---
layout: post
title: 🥅 Durable .NET - The Dry Trap
date:  2024-12-26 01:00:00 +1000
categories: dotnet
tags: clean-code, dry, wet, solid, object-oriented-programming, oop, separation-of-concerns, tight-coupling
author:
- Piers Sinclair
published: true
---

![DRY vs WET](/assets/images/2024-12-16-Durable-Dotnet-The-Dry-Trap)\
**Figure: To DRY or not to DRY?**

I often see the concept of Do Not Repeat Yourself (DRY) championed as the most important concept for software engineers to follow.

It's true that where possible you want to reduce duplication in code to avoid maintaining the same logic in multiple places, and potential synchronization issues.

Unfortunately, this concept is promoted so religiously that it causes a dangerous situation to occur. Engineers start looking to apply this concept to everything, everywhere no matter the cost.

The problem of course, is that when misused DRY causes more headaches and is more dangerous than any duplicated code that could occur in a system.

You might wonder: what's wrong with reducing duplication?

The answer as usual comes back to tight coupling, separation of concerns and SOLID.

By trying to apply DRY to 2 sets of logic which are seemingly similar but actually represent different logical flows you fall into the trap of coupling those 2 logic flows together.

Let's take a look at a few examples.

### Scenario #1 - The Product Class

Let's say we are building a system for managing products. To represent an product we have a `Product` class:

```csharp
public class Product
{
    public Guid Id { get; set; }
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
    public decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

```csharp
public class DigitalProduct : Product
{
    private const decimal _salesTaxModifier = 1.1M;
    public decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

```csharp
public class Service : Product
{
    private const decimal _salesTaxModifier = 1.1M;
    public decimal GetSellPrice()
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
    public decimal GetSellPrice()
    {
        return Price * _salesTaxModifier;
    }
}
```

At first glance it looks like a great idea, the logic is identitical. The problem is that while the logic is the same right now, it's unlikely to remain the same because it has a logically different purpose. There is no guarantee that a product's price will always remain the same among all product types.

Let's say it's been 6 months and the `GetSellPrice()` function has been used gratuitously in 100s of places in the code. Now the business comes to us and says "We would like our digital products and services to have a 5% discount applied across the board to encourage our users to purchase them over physical products".

The engineer looks at the code and decides to add an if statement into the function:

```csharp
private const decimal _salesTaxModifier = 1.1M;
private const decimal _discount = 0.95M;
public decimal GetSellPrice()
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
public decimal GetSellPrice()
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

The logic is pretty complex now, each product has a distinct flow and it is confusing to debug what is going on. Hopefully you can see that each type of product generally has a different logical flow even though when we started it looked very similar.

For this reason it's better to keep the function local to each product, and this is also a good reason for the Product Class to be an interface. It often causes more problems than it's worth to share business logic through inheritance. Here's how it would look:

```csharp
public interface IProduct
{
    Guid Id { get; set; }
    string Name { get; set; }
    decimal Price { get; set; }

    decimal GetSellPrice();
}

public class PhysicalProduct : IProduct
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required decimal Price { get; set; }
    public decimal GetSellPrice()
    {
        return Price * Constants.SalesTaxModifier;
    }
}

public class DigitalProduct : IProduct
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required decimal Price { get; set; }

    private const decimal _discount = 0.95M;
    public decimal GetSellPrice()
    {
        return Price * Constants.SalesTaxModifier * _discount;
    }
}

public class Service : IProduct
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required decimal Price { get; set; }

    private const decimal _discount = 0.95M;
    public decimal GetSellPrice()
    {
        return Price * _discount;
    }
}

public class Constants
{
    public const decimal SalesTaxModifier = 1.1M;
}
```

There's a few things to notice here:

1. Each SellPrice function is slightly different, and it's much easier to understand the logical flow of each one.
2. Sales Tax has been moved to a global constant but discount has not. The reasoning for this is that sales tax is generally a global concept, it is applied to all products equally. On the other hand discount may be local to a product type, we might have a different discount for digital products than we do for services.
3. The properties of the interface now need to be duplicated, at first glance this looks bad, but the reality is that modern IDEs provide powerful renaming functionality that mean it's very easy to change the names. Moreover, by having separate properties it's easier to find references to only the names for specific product types e.g. PhysicalProducts.

Overall, this refactor is going to make it easier to:
1. Understand logic specific to a product type.
2. Find references related to a specific product type
3. Refactor names and logic for a specific product type.

At this point you might be wondering, why bother with the IProduct interface at all? The answer is that it provides a contract for consumers. Consumers can now use the IProduct interface in the code and not have to worry about the lower level implementation details. They know they can call GetSellPrice and get the right value without having to know about internal discounts, sales tax etc.

### Scenario #2 - Requests

It can be tempting to reuse a class for different requests in your REST API.

For example you might have an endpoint for both creating and updating your products. In this case you might think, why not have 1 ProductRequest model and use it across both?

```csharp
public enum Status
{
    Active,
    Inactive
}

public class ProductRequest
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required decimal Price { get; set; }
    public required Status Status { get; set; }
}
```

It sounds good in theory but the problem is that there are likely to be subtle differences between your endpoints that confuse things.

For example, when creating a product you might not need to provide an ID because the system creates one for you while in your update request the ID might be required so it knows which resource to update.

Similarly, a status field may not be required on create because it is always created with status "Active", but for update you might be able to set it to either "Inactive" or "Active" meaning you need the status field.

For these reasons, it's better to keep the models of requests separate. Simply create both an UpdateProductRequest.cs and a CreateProductRequest.cs

```csharp
public enum Status
{
    Active,
    Inactive
}

public class UpdateProductRequest
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required decimal Price { get; set; }
    public required Status Status { get; set; }
}

public class CreateProductRequest
{
    public required string Name { get; set; }
    public required decimal Price { get; set; }
}
```

Remember, it's fairly cheap to reproduce properties across classes but untangling classes that have been closely coupled can be a nightmare.

### Summary

In summary, DRY is a crucial concept in software engineering, you don't want to have common logic being repeated across the code.

At the same time, DRY can be a dangerous concept. It's even more scary to change code when 2 concepts are tightly coupled together.

So, it's critical to think hard about whether DRY is really appropriate for a given scenario and if unsure I would lean to duplication (aka WET, Write Everything Twice 😂). You can always remove the duplication as you gain greater understanding of the code and the domain.
