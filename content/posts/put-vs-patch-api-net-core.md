---
title: "Put vs Patch Api in .Net Core"
description: "When and how to use http verbs put and patch in your .Net Core Api"
date: 2018-12-12T08:04:16-05:00
draft: false
categories: [.Net]
seq: 0003
tags: ["#csharp","#api","#jsonpatch"]
---

There are 2 http verbs that can be used when updating a resource: **Put** and **Patch** but when to use one over the another ? In simplistic terms the former updates the entire resource whereas the latter updates one partially.

Let's code! Given the following model:

{{< highlight cs "linenos=table">}}
public class Customer
{
	public int Id { get; set; }
	public string FirstName { get; set; }
	public string MiddleName { get; set; }
	public string LastName { get; set; }
	public DateTime DateOfBirth { get; set; }
}
{{< /highlight>}}	

and the following dto's

{{< highlight cs "linenos=table">}}
public class CustomerDto
{
	public string FirstName { get; set; }
	public string MiddleName { get; set; }
	public string LastName { get; set; }
	public DateTime DateOfBirth { get; set; }
}

public class CustomerResponseDto : CustomerDto
{
	public int Id { get; set; }
}
{{< /highlight>}}		

> **"What the heck! You have the same thing in different places!"** I never expose my models on my public Api's even though they may be 100% identical. I like to be as explicit as possible when it comes to what information I expose over the boundaries of my app. Changing the model by adding a new property will expose
the same property to the Api and that may not be what you want. There are tools such as AutoMapper that make this process of converting Model<->Dto a breeze.

#### Post implementation
{{< highlight cs "linenos=table">}}
[HttpPost]
public async Task<IActionResult> Add([FromBody] CustomerDto customerDto)
{
	try
	{
		if (!ModelState.IsValid) return BadRequest(ModelState);
		var model = _mapper.Map<CustomerDto, Customer>(customerDto);
		await _customerRepo.AddAsync(model);
		await _customerRepo.SaveAllAsync();
		var output = _mapper.Map<Customer, CustomerResponseDto>(model);
		return Created($"/api/customers/{model.Id}", output);

	}
	catch (Exception e)
	{
		_log.LogError($"error adding customer {e}");
	}

	return BadRequest();
}
{{< /highlight >}}		

Post request

{{< highlight js "linenos=table">}}
{
	"firstName":"Mike",
	"lastName":"Smith",
	"dateOfBirth":"06/13/1959"
}
{{< /highlight >}}		

Post response

{{< highlight js "linenos=table">}}
{
    "id": 1,
    "firstName": "Mike",
    "middleName": null,
    "lastName": "Smith",
    "dateOfBirth": "1959-06-13T00:00:00"
}
{{< /highlight >}}		

The new customer has been added but now I want to change it and give it a middle name. I'll first implement the **Put** verb
#### Put implementation

{{< highlight cs "linenos=table">}}
[Route("{customerId:int}")]
[HttpPut]
public async Task<IActionResult> Put(int customerId, [FromBody] CustomerDto dto)
{
	try
	{
		if (!ModelState.IsValid) return BadRequest(ModelState);
		var oldCustomer = await _customerRepo.GetAsync(customerId);
		if (oldCustomer == null) return NotFound();
		_mapper.Map(dto, oldCustomer);
		await _customerRepo.SaveAllAsync();

		return Ok(_mapper.Map<Customer, CustomerResponseDto>(oldCustomer));
	}
	catch (Exception)
	{
	}
	return BadRequest("Error updating customer");
}
{{< /highlight >}}

As I mentioned in the beginning of this post the **put** verb updates the **entire resource**. Ie. You have to send the new property value along with everything else.

Put request 

{{< highlight js "linenos=table">}}
//http://localhost:59122/api/customers/1
{
	"firstName":"Mike",
	"lastName":"Smith",
	"middleName":"J.",
	"dateOfBirth":"06/13/1959"
}
{{< /highlight>}}

Put response

{{< highlight js "linenos=table">}}
{
    "id": 1,
    "firstName": "Mike",
    "middleName": "J.",
    "lastName": "Smith",
    "dateOfBirth": "1959-06-13T00:00:00"
}
{{< /highlight>}}

The client needs to first issue a get, update the property and then issue a put. What if we try to make the client faster by eliminating the first call and just send up the property that has changed ?
#### Put implementation - trying to send only 1 property

Put request:

{{< highlight js "linenos=table">}}
//http://localhost:59122/api/customers/1
{
	"middleName":"J."
}
{{< /highlight>}}

Put response:

{{< highlight js "linenos=table">}}
{
    "id": 1,
    "firstName": null,
    "middleName": "J.",
    "lastName": null,
    "dateOfBirth": "0001-01-01T00:00:00"
}
{{< /highlight>}}

**"Oh No!!!Where's everything else ?!"** Sorry, but you have updated the entire resource and lost all those values. Hopefully your back-up is up-to-date. :smiley:

**"Bummer! Ok, I'll check for null properties and update the resource accordingly"** Not quite there! What if you want to update a field to Null ?

What we want to do is to update the resource partially. Ie. We want to **patch** it but by just having a new verb Patch is not magically handle everything for you. 
You need to send to the api endpoint not just the new value but what you are doing with it.

#### Hello JSON Patch :heartpulse:
JSON Patch is a contract for describing changes on a JSON document in a very explicit way. You client can tell things such as whether they are adding, replacing or removing values from the JSON document.

#### Patch implementation
You first need to pull in a package called "JSON Patch" which adds support to your .Net Core Api

{{< highlight csharp "linenos=table">}}
[Route("{customerId:int}")]
[HttpPatch]
public async Task<IActionResult> Patch(int customerId, [FromBody] JsonPatchDocument<CustomerDto> patchModel)
{
	try
	{
		var customerDb = await _customerRepo.GetAsync(customerId);
		if (customerDb == null) return NotFound();
		var customerDbDto = _mapper.Map<Customer, CustomerDto>(customerDb);

		patchModel.ApplyTo(customerDbDto);
		_mapper.Map(customerDbDto, customerDb);

		await _customerRepo.UpdateAsync(customerDb);
		await _customerRepo.SaveAllAsync();

		return Ok(_mapper.Map<Customer, CustomerResponseDto>(customerDb));
	}
	catch (Exception e)
	{
		_log.LogError($"error updating customer {e}");
	}

	return BadRequest("Error updating customer");
}
{{< /highlight>}}

Since we are receiving a < CustomerDto > we first need to convert the database entry to the same dto type (line 9) and then we **patch** it
with the values that are coming in (line 11). Now we can merge the original model with the dto which will result in a model with the updated values (line 12).

#### What my clients need to send ?

Your clients need to explicitly say what they are doing. Ie. They need to send up a specific JSON document:

{{< highlight js "linenos=table">}}
[
  { "op": "replace", "path": "/baz", "value": "boo" },
  { "op": "add", "path": "/hello", "value": ["world"] },
  { "op": "remove", "path": "/foo" }
]
{{< /highlight >}}

The sample above has 3 operations Replace, Add and Remove. The first one replaces the value of a property named baz. The 2nd one 
adds a new property to the document and the 3rd one removes.

Now we have everything in place and we can finally send just a single property:

Patch request:

{{< highlight js "linenos=table">}}
//http://localhost:59122/api/customers/1
[
	{"op" : "replace", "path" : "middleName", "value" : "J."}
]
{{< /highlight >}}

Patch response:

{{< highlight js "linenos=table">}}
{
    "id": 1,
    "firstName": "Mike",
    "middleName": "J.",
    "lastName": "Smith",
    "dateOfBirth": "1959-06-13T00:00:00"
}
{{< /highlight>}}