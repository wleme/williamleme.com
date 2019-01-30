---
title: "YNAB starter kit in .Net Core 2.2"
date: 2019-01-30T15:03:09-05:00
draft: false
cover: /imgs/0006-ynablogo.png#center
tags: ["#csharp"]
---

Want to start developing custom YNAB tools using .net core ? You can use this github project as a base [https://github.com/wleme/YnabDotNetCoreStarterKit]

This project successfully implements the OAuth middleware and saves the tokens in a cookie. It then retrieves the access token every time it pulls data from their API (**budgets** and **categories within a budget**). It also leverages the new HttpClientFactory (introduced on .net core 2.1).

You need to get your own Client Id and Client Secret and update appsettings.json.

Issues ? Please go to github. PRs are also welcome.

YNAB Api doc: [https://api.youneedabudget.com/]