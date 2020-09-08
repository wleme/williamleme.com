---
title: "Models and DTOs in Your API"
description: "Why you should avoid using model objects in your API interfaces"
date: 2018-12-12T15:08:34-05:00
draft: false
seq: 0004
tags: ["api","csharp"]
---

I religiously avoid using model objects on my API interfaces. The reason is really simple, a model is a business entity and you don't want to expose a business entity inadvertently to your API consumers. <!--more--> 
#### What's the problem ?

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

There's nothing special here but now the business wants to track the product markup and you decided to go with a new property:

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
are aware and have the **responsability** of dealing with this information but on the other hand you might be exposing the same API to external access. 

#### How to determine when to use a DTO or a model in you API
As I said previously you might be exposing your API only to internal apps which by sending the same Product model would be harmless. But you might be exposing the same API to external access. So the answer is a straight
**"it depends"**. Since I don't want to have a different approach for every single case and I like uniformity throughout my app I always go with DTOs even though they might be exactly the same as the model. The DTO allows your 
team-members and business to make a concious decision whether they want to share a piece of information to whoever is pulling this data from the API.

#### But be careful when using AutoMapper :warning:
I use **AutoMapper** to map my models into DTOs and vice-versa. Let's consider the following Product DTO

{{< highlight cs "linenos=table">}}
public class ProductDto
{
	public int Id { get; set; }
	public string Sku { get; set; }
	public string Name { get; set; }
	public decimal ListPrice { get; set; }
}
{{< /highlight>}}	

and the following Product which has already been added

{{< highlight js "linenos=table">}}
{
    "id": 1,
    "sku": "abc01",
    "name": "useless stuff",
    "listPrice": 10.99
}
{{< /highlight>}}	

I want to change the name from "useless stuff" to "super useless stuff". My Put API is implemented as follows:

{{< highlight cs "linenos=table,hl_lines=3 10 14">}}
[Route("{ProductId:int}")]
[HttpPut]
public async Task<IActionResult> Put(int productId, [FromBody] ProductDto dto)
{
	try
	{
		if (!ModelState.IsValid) return BadRequest(ModelState);
		var oldProduct = await _productRepo.GetAsync(productId);
		if (oldProduct == null) return NotFound();
		_mapper.Map(dto, oldProduct);
		await _productRepo.UpdateAsync(oldProduct);
		await _productRepo.SaveAllAsync();

		return Ok(_mapper.Map<Product, ProductDto>(oldProduct));
	}
	catch (Exception e)
	{
		_log.LogError($"error updating product {e}");
	}

	return BadRequest("Error updating product");
}
{{< /highlight>}}	

_We are receiving a ProductDto (line 3), pulling the product from the database, mapping the dto with it (line 10) and returning a converted ProductDto to the caller (line 14)_
 

Request:

{{< highlight cs "linenos=table">}}
//PUT http://localhost:59122/api/products/1
{
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"10.99"
}
{{< /highlight >}}	

Response:

{{< highlight cs "linenos=table,hl_lines=2">}}
{
    "id": 0,
    "sku": "abc01",
    "name": "super useless stuff",
    "listPrice": 10.99
}
{{< /highlight >}}	

**I wanted to update product id 1 but why am I seeing id 0 ?** 

You didn't pass any value for the Id property so the default value was set to 0. AutoMapper identified this property in the Dto and added it to the Model pulled from the Database. 
**In the end the new merged model was updated to 0**.

#### How to guarantee I'm not updating what I don't want to update ?

You could check whether the DTO Id is > 0 and receive the following request:
{{< highlight cs "linenos=table,hl_lines=1 3">}}
//PUT http://localhost:59122/api/products/1
{
	"id": 1,
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"10.99"
}
{{< /highlight >}}	

_The request contains the same id in both the url (line 1) and the body (line 3)_

You would also need to make sure the id from the DTO (line 3) **is the same** as the id passed in the url otherwise the following request would update the wrong product:

{{< highlight cs "linenos=table,hl_lines=1 3">}}
//PUT http://localhost:59122/api/products/1
{
	"id": 5,
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"10.99"
}
{{< /highlight >}}	

That's a lot of manual checks for your controller to do. What if we guarantee they cannot update the id by simply not receiving it in the DTO ? Let's remove the id property from the DTO:

{{< highlight cs "linenos=table">}}
public class ProductDto
{
	public string Sku { get; set; }
	public string Name { get; set; }
	public decimal ListPrice { get; set; }
}
{{< /highlight>}}

and make a new request:

{{< highlight cs "linenos=table">}}
//PUT http://localhost:59122/api/products/1
{
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"10.99"
}
{{< /highlight >}}	

response:

{{< highlight cs "linenos=table">}}
{
    "sku": "abc01",
    "name": "super useless stuff",
    "listPrice": 10.99
}
{{< /highlight >}}	

**Did it work ?**

I don't know. I want to be able to see the Id in the response.

#### 1 DTO for the request and another one for the response.

We want to have a DTO that doesn't receive the Id property for the request but we do want to send everything + the Id value as a response. Hello ProductDto and ProductResponseDto:

{{< highlight cs "linenos=table">}}
public class ProductDto
{
	public string Sku { get; set; }
	public string Name { get; set; }
	public decimal ListPrice { get; set; }
}

public class ProductResponseDto:ProductDto
{
	public int Id { get; set; }
}
{{< /highlight>}}

New Put method

{{< highlight cs "linenos=table,hl_lines=3 14">}}
        [Route("{ProductId:int}")]
        [HttpPut]
        public async Task<IActionResult> Put(int productId, [FromBody] ProductDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                var oldProduct = await _productRepo.GetAsync(productId);
                if (oldProduct == null) return NotFound();
                _mapper.Map(dto, oldProduct);
                await _productRepo.UpdateAsync(oldProduct);
                await _productRepo.SaveAllAsync();

                return Ok(_mapper.Map<Product, ProductResponseDto>(oldProduct));
            }
            catch (Exception e)
            {
                _log.LogError($"error updating product {e}");
            }

            return BadRequest("Error updating product");
        }
{{< /highlight>}}
_We are receiving a ProductDto (line 3) and returning a ProductResponseDto (line 14)_


request:

{{< highlight cs "linenos=table">}}
//PUT http://localhost:59122/api/products/1
{
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"10.99"
}
{{< /highlight >}}	

response:

{{< highlight cs "linenos=table">}}
{
    "id": 1,
    "sku": "abc01",
    "name": "super useless stuff",
    "listPrice": 10.99
}
{{< /highlight >}}	

Yes, It is working :thumbsup: and since we are not receiving an Id in the dto we can make a request like the following:

{{< highlight cs "linenos=table,hl_lines=1 3">}}
//PUT http://localhost:59122/api/products/1
{
	"id": 5,
	"sku":"abc01",
	"name":"super useless stuff",
	"listPrice":"20.99"
}
{{< /highlight >}}	

and the id will be safelly ignored.

response:
{{< highlight cs "linenos=table">}}
{
    "id": 1,
    "sku": "abc01",
    "name": "super useless stuff",
    "listPrice": 20.99
}
{{< /highlight>}}


Happy coding!