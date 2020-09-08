---
title: "Accessing OAuth access token in Asp.Net Core 2"
description: "How to access OAuth access tokens"
date: 2019-01-29T15:39:04-05:00
draft: false
tags: ["csharp"]
---

You can easily access the OAuth access token by calling <!--more--> **GetTokenAsync**.

#### Make sure to set SaveTokens = true when setting up OAuth middleware

{{< highlight cs "linenos=table,hl_lines=17" >}}
public void ConfigureServices(IServiceCollection services)
{
	services.AddAuthentication(options =>
	{
		options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
		options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
		options.DefaultChallengeScheme = "CustomName";
	})
	.AddCookie(options =>
	{
		options.Cookie.Name = "CustomName";
	})
	.AddOAuth("CustomName", options =>
	{
		//set all options...

		options.SaveTokens = true;
	});
}
{{< / highlight>}}

#### Access token

You can then access the token by calling **GetTokenAsync** in your controller

{{< highlight cs >}}
var token = await HttpContext.GetTokenAsync("access_token");
{{< / highlight>}}