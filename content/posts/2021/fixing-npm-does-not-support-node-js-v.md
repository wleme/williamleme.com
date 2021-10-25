---
title: "Fixing 'npm does not support Node.js v xx.xx'"
date: 2021-10-22T20:13:09-04:00
draft: false
tags: ["nodejs"]
---

Upon updating a node version you may see the following message stating your npm is **not** compatible with the newly installed nodejs version

{{< highlight ps1 "linenos=table">}}
npm WARN npm npm does not support Node.js v14.18.1
npm WARN npm You should probably upgrade to a newer version of node as we
npm WARN npm can't make any promises that npm will work with this version.
npm WARN npm Supported releases of Node.js are the latest release of 6, 8, 9, 10, 11, 12.
npm WARN npm You can find the latest version at https://nodejs.org/
{{</ highlight >}}


Solution

* Unistall NodeJs
* Delete `%AppData%\npm` and `%AppData%\npm-cache`
* Reinstall the new NodeJs version