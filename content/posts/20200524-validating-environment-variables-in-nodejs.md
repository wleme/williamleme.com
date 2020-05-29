---
title: "Automatically checking whether environment variables exist in the host OS (Nodejs)"
description: Checking whether all environment variables exist in the host OS dynamically when publishing your app to production.
date: 2020-05-24T19:37:18-04:00
draft: false
tags: ["nodejs"]
summary: How to check if all the environment variables are set in production ?
---

If you use nodemon during dev you may know you can define a file called nodemon.json with all the environment variables your app uses:

{{< highlight js "linenos=table" >}}
{
    "env" : {
        "APP_MONGO_CONN":"mongodb://user:password@192.0.0.1:27017/db",
        "APP_PORT":3000,
        "APP_REDIS":"redis://password@192.0.0.1"
    }
} 
{{< / highlight>}}

That works just fine during development but once you publish your app to production you are on your own. We have to have those environment variables defined at the OS level otherwise your app will crash and depending on your logging strategy you may spend lots of time trying to figure it out.

In order to avoid such problem I like to make sure those variables exist preferably when the app comes up. The idea is if there's any missing variable the app won't start.

One solution is to check whether those variables exist individually:

{{< highlight js "linenos=table" >}}
if (!process.env.APP_MONGO_CONN) {
    //do smth
}
{{< / highlight>}}

The problem with this approach is you may add a new key to nodemon.json and forget to check whether the value exist.

A solution that I came up with is a module that checks all the names dynamically and calls an error callback in case there's any missing item.

{{< highlight js "linenos=table" >}}
//function takes 2 parameters: an error and a success callback
const check = (errCallback,successCallback)=> {
    const nodemon = require('../nodemon.json'); //reading nodemon.json.
    let invalidKeys = [];
    
    Object.entries(nodemon.env).forEach(([key,value]) => { //pulling all the keys under env key
        if (!process.env[key]) {
            //if it doesn't exist in the host environment, it adds to the array
            invalidKeys.push(key);
        }
    })

    if (invalidKeys.length>0) 
        errCallback(invalidKeys);
    else
        successCallback();
}

module.exports = {
    check
}
{{< / highlight>}}

Usage in your main js file

{{< highlight js "linenos=table" >}}
//...omitted
const envChecker = require('./support/envChecker');

envChecker.check((keys) => {
    //error callback
    log.error('environment variable(s) not found:  ' + keys)
}, () => {
    //success callback
    const port = process.env.APP_PORT || 3000;
    app.listen(port,() => {
        log.info(`server running on port ${port}`);
    });
});
{{< / highlight>}}

The app won't start if any of the environment variables defined in the nodemon.json file don't exist in the host, saving you hours of headaches :smirk: