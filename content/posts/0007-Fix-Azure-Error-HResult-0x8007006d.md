---
title: "Fix Azure Error 0x8007006d / Event Id 1022 "
description: How to fix Azure App Service Error 0x8007006d | Event Id 1022 | Message Id 0x250d
date: 2020-04-07T08:20:00
draft: false
tags: ["#azure"]
---

After almost 3 years of flawless service availaility my app service came to a halt with the following event entry

{{< highlight js "linenos=table" >}}
<EventData>
<Data>
.NET Runtime version 4.0.30319.0 - Loading profiler failed. Failed trying to receive from out of process a request to attach a profiler. HRESULT: 0x8007006d. Process ID (decimal): 60152. Message ID: [0x250d].
</Data>
</EventData>
{{< / highlight>}}

No code changes and no service changes were made so the solution was to **restart the app service** :/ :rage:
