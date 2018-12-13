---
title: "Models and DTOs in Your API"
description: "Why you should avoid using model objects in your API interfaces"
date: 2018-12-12T15:08:34-05:00
draft: true
seq: 0004
tags: ["#API","#csharp"]
---

I religiously avoid using model objects on my API interfaces. The reason is really simple, a model is a business entity and you don't want to expose a business entity inadvertently to your API consumers. You might 
be using model objects in your API interfaces and everything is going well so you may ask "Why do I need to have a DTO exactly the same as my model ?". You may be aware that if you add a new information to your model, 
your API consumers are also receiving it but what if, down the road, there's a new developer who isn't aware and you guys end-up sharing information by mistake ? The costs of implementing a DTO and mapping it with a 
model are none and using a tool such as AutoMapper make this process straightforward. The 'time required' to add 1 extra line needed to map DTO<->Model will offset any issues with sharing 

#### What's the problem (technically-speaking)?

Consider the following model being used by the business layer of your application and also being returned in a get method of your API

{{< highlight cs "linenos=table">}}
public class Product
{
	public int Id { get; set; }
	public string Sku { get; set; }
	public string Name { get; set; }
	public decimal ListPrice { get; set; }
}
{{< /highlight >}}

There's nothing special here but now the business wants to track the product's markup:
{{< highlight cs "linenos=table,hl_lines=7">}}
public class Product
{
	public int Id { get; set; }
	public string Sku { get; set; }
	public string Name { get; set; }
	public decimal ListPrice { get; set; }
	public decimal MarkUp { get; set; }
}
{{< /highlight >}}

Now your API is also sending the product markup. Does you business want to let everybody know they are marking-up a product by 3000% ? Maybe or maybe not. Maybe your APIs are consumed only by internal apps and they 
have the **responsability** of dealing with this information but on the other hand you might be exposing the same API to external access. 

#### How to determine when to use a DTO or a model in you API
As I said previously you might be exposing your API only to internal apps which by sending the same Product model would be harmless. But you might be exposing the same API to external access. So the answer is a straight:
**it depends**. Since I don't want to have a different approach for every single case and I like uniformity throughout my app I always go with DTOs even though they might be exactly the same as the model. The DTO allows your team-
members to make a concious decision whether they want to share a piece of information to whoever is pulling this data from the API.

#### Be careful when updating a resource using AutoMapper
I use AutoMapper in order to make the conversion DTO <=> Model
When dealing with DTOs and models you don't want to convert them manually and that's what AutoMapper does for us.
This is another approach that I also take. I have 2 sets of DTOs, one for the request and another one for the response. 99.999% of the cases the only difference is the response DTO will have everything 
from the request DTO + Id field


##### Why different DTO's ?








