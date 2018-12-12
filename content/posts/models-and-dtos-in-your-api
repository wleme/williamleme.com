---
title: "Models and Dtos in Your Api"
description: "Why you should avoid using model objects in your api interfaces"
date: 2018-12-12T15:08:34-05:00
draft: true
seq:0004
tags: ["#api","#csharp"]
---

I religious avoid using model objects on my api interfaces. The reason is really simple, a model is a business entity and you don't want to expose a business entity inadvertently to your api consumers. You might 
be using model objects in your api interfaces and everything is going well so you may ask "Why do I need to have a dto exactly the same as my model ?". You may be aware that if you add a new information to your model, 
your api consumers are also receiving it but what if, down the road, there's a new developer who isn't aware and you guys end-up sharing information by mistake ? The costs of implementing a dto and mapping it with a 
model are none and using a tool such as AutoMapper make this process straightforward. The 'time required' to add 1 extra line needed to map Dto<->Model will offset any issues with sharing 

#### What's the problem (technically-speaking)?


#### Why different Dto's for request and response ?
This is another approach that I also take. I have 2 sets of dto's, one for the request and another one for the response. 99.999% of the cases the only difference is the response dto will have everything 
from the request dto + Id field


##### Why different Dto's ?








