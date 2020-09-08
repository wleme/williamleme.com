---
title: "App: A Url Shortener Web App"
date: 2020-05-28T07:01:23-04:00
draft: false
tags: ["myapps","nodejs","mongodb"]
categories: ["nodejs"]
summary: A url shortener web app built in NodeJs + EJS + MongoDb + Redis
---

Url: https://s.wllapps.com

I have put together a new app: A url shortener web app hosted at https://s.wllapps.com and built with nodejs / express + ejs + redis + mongodb. The idea is really simple, a full url is provided and a short version of it is returned e.g. _s.wllapps.com/code_ where _code_ is the unique identifier for that specific url.

When a new url comes in, this app generates a new code and stores it in nodejs. When there's a request for a given _code_ the web app pulls the mongo db document and redirects the user to its url.

#### MongoDb and Redis ?
I save the url along with its unique code in mongodb but also leverage redis in order to store the total number of urls that have been shortened. The idea is when you go to https://s.wllapps.com you are going to see the total number of urls right on the front page but I don't want to do a _db.collection.countDocument({})_ on every request, which would have some performance issues as the application grows, therefore I keep this information in an in-memory redis instance.

When the app connects to mongoDb I go ahead pull the total number of documents and store this information in a redis key. Check out the snippet below:

{{< highlight js "linenos=table" >}}
//mongodb js module:
exports.mongoConnect = callback => {
    MongoClient.connect(process.env.MONGODB)
    .then(client => {
        _db = client.db();
        _db.collection('codes').countDocuments({},(err,number) => { //pulling total number of docs
            redis.getClient().set("total_codes", number,() => { //setting redis key
                callback();
            })
        });
    })
    .catch(err=> {
        log.error(err);
        throw err;
    })
};
{{< / highlight>}}

When a user access the main route I first get the redis key value (line 4) and pass this information down to a ejs page (line 5). Note that _redis_ is another js module

{{< highlight js "linenos=table" >}}
//my router js module:
//....omitted
router.get('/', (req,res,next)=> {
    redis.getTotalCodes((total)=> {
        res.render('index',{count:total})
    })
})

module.exports = router;
//....omitted
{{< / highlight>}}

###### What about new data ?
The first time the apps comes up I load the total number of docs on a redis cache and every time there's a new code I just update the cache by 1 besides adding a new document to the collection

{{< highlight js "linenos=table" >}}
//...adding new mongodb doc is omitted
redis.getClient().incr("total_codes", () => {
    res.redirect('/created');
}) 
{{< / highlight>}}

#### Generating a new code
I had to generate a unique code for every url which had to be short (otherwise it wouldn't be called url **shortener** :smiley:). The first thing that came to my mind was just to use a sequential number e.g. /1 /2 /3 and so on but although it was gonna be really short _--up to 4 digits--_ I didn't want the discoverability to be that easy that people would just type a number and they could see the original page.

I ended up leveraging mongo db document id which consists in [3 parts](https://docs.mongodb.com/manual/reference/method/ObjectId/):

- a 4 byte timestamp value
- a 5 byte random value
- a 3 byte incremental value, initialized to a random value

I want to use the last 3 bytes which gives me what I want. First I add a new document, retrieve its id, pull the last 3 bytes out of it, create a new short code based on that and update the document.

First, a module that parses mongo db id:

{{< highlight js "linenos=table" >}}
exports.parse = (id) => {
    var ctr = 0;
    id = id.toString();

    const _timestamp   = parseInt(id.slice(ctr, (ctr+=8)), 16);
    const _machineId   = parseInt(id.slice(ctr, (ctr+=6)), 16);
    const _processId   = parseInt(id.slice(ctr, (ctr+=4)), 16);
    const _counter     = parseInt(id.slice(ctr, (ctr+=6)), 16);

    return {
        timestamp: new Date(_timestamp*1000),
        counter: _counter,
        machineId: _machineId,
        processId: _processId
    }
}
{{< / highlight>}}

and my controller that adds a new document, gets its add, parses the id, creates the code and updates the document again: 
{{< highlight js "linenos=table" >}}
const resultInsert = await db.collection('codes')
        .insertOne({
            url:url
        });

var id = resultInsert.insertedId.toString();
const p = parser.parse(id);
const shortenerCode = generateCode(p.counter);

 const resultUpdate = await db.collection('codes')
        .updateOne(
            {_id: new mongodb.ObjectID(id)},
            {$set: {
                code:shortenerCode
            }} 
        )
{{< / highlight>}}

###### Adding some characters to the code
The sequential number from the mongo db doc id is, wait for it..., a number :unamused: but I wanted to throw some characters in it in order to reduce the easiness of discovering a new code. I was able to accomplish that by converting the number to a base 32 encoding which uses a 32-character set comprising the twenty-six upper-case letters A–Z, and the digits 2–7. [[more about base 32 encoding]](https://en.wikipedia.org/wiki/Base32) and also reverting the string so sequential strings are not so easy to find.

{{< highlight js "linenos=table" >}}
const generateCode = (sequence) => {
    const s = sequence.toString(32);
    return s.split( '' ).reverse( ).join( '' );
}
{{< / highlight>}}

and voila...a working url shortener. :+1:
