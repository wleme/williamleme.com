---
title: "Securing Jwt tokens in a Cookie in nodejs - Part 1"
date: 2021-01-18T20:31:38-05:00
tags: ["nodejs"]
draft: true
---

# Authenticating your SPA



We have 2 options when it comes to store jwt tokens in the client. Local Storage or Cookies.

# Storing the token in the Local Storage
By storing it in the local storage it's just a matter for your SPA to read it and send it to the API along with the request itself.

## What's the problem with the local Storage

The problem with the local storage is that any javascript in your app can read it. Your app uses thrid-party/open source components that you just trust them. You don't have the time to audit each of them and make sure what they are doing internally. One of them may be reading your local storage and sending it somewhere else. This is called XSS attack or Cross Site Scripting

## What's the solution ?

The solution for XSS is storing the token in a http-only cookie

# Storing the token in a http-only cookie

Http-only cookies cannot be accessed by any javascript in your app. They are only readable by the server. This behaviour mitigates the issue with the local storage.



![](/imgs/2021/2021-003.png#c)