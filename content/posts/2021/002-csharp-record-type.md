---
title: "C# - Record Types in practice"
date: 2021-01-11T18:25:42-05:00
draft: false
tags: ["csharp",".net"]
---

C# 9.0 introduces a new type called *record type* which is an immutable reference type with a 'built-in' value-based comparison. It's inumattble because once the object is created it cannot be changed.
<!--more-->
The example below creates 2 structures. A Record and a regular Class 
{{< highlight cs "linenos=table" >}}
public record CarRecord
{
    public string Maker { get; }
    public CarRecord(string maker) => (Maker) = (maker);
}

public class CarClass
{
    public string Maker { get;}
    public CarClass(string maker) => Maker = maker;
}
{{</ highlight >}}    

Let's create 2 objects with the same values and compare them. 

{{< highlight cs "linenos=table" >}}
//Record
var firstCar = new CarRecord("honda");
var secondCar = new CarRecord("honda");
Console.WriteLine(firstCar == secondCar); //true because a Record structure provides a value-based comparison

//Class
var firstCarClass = new CarClass("honda");
var secondCarClass = new CarClass("honda");
Console.WriteLine(firstCarClass == secondCarClass); //false because we are comparing 2 different instances
{{</ highlight >}}            

Records support inheritance and abstraction:

{{< highlight cs "linenos=table" >}}
public record HondaRecord : CarRecord
{
    public string Model { get; }
    public HondaRecord(string model) : base("honda") => Model = model;
}
{{</ highlight >}}        

{{< highlight cs "linenos=table" >}}
var firstCar = new CarRecord("honda");
var secondCar = new HondaRecord("crv");
Console.WriteLine(firstCar == secondCar); //false
Console.WriteLine(secondCar is CarRecord); //true
{{</ highlight >}}        

Records can also be declared in a more concise form:

{{< highlight cs "linenos=table" >}}
public record CarRecord(string Maker);
public record HondaRecord(string Model):CarRecord("honda");
{{</ highlight  >}}

Creating a copy of a record:

{{< highlight cs "linenos=table" >}}
var anotherSecondCar = secondCar; //creates a copy
var anotherCrv = secondCar with { }; //it also creates a copy
var civic = secondCar with { Model = "civic" }; //creates a copy with a new Model property value
Console.WriteLine(anotherCrv == civic); //false
{{</ highlight  >}}