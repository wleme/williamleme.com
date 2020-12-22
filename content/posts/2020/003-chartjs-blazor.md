---
title: "Chart.js + Blazor"
description: "Abstracting the usage of the Chart.Js Library in a Blazor WebAssembly Component"
cover: "/imgs/2020/003-cover.png#center"
date: 2020-06-12T07:43:27-04:00
draft: false
tags: ["blazor"]
---

In this tutorial we will be creating a blazor component that receives the chart data and passes it to the [Chart js library](https://www.chartjs.org). This component will be limited to a Pie and Bar types but the idea is the same in case you want to implement other types.
<!--more-->
## Adding Chart.js to the project

Go to index html and add the Chart.js library from their cdn

{{< highlight html "linenos=table" >}}
<!--index.html-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js"></script>
{{< / highlight>}}

## Creating a Chart blazor component

 We are going to create a new file called `Chart.razor`. Our component will receive all the data from the parent and pass it down to the Chart.js library via Javascript interop. It will have the following properties: Id, Type, Data, BackgroundColor and Labels. Usage example: `<Chart Id="pie1" Type="@Chart.ChartType.Pie" Data="@(new[] { "1", "2" })" BackgroundColor="@(new[] { "blue","green"})" Labels="@(new[] { "Fail","Ok"})"></Chart>`.<br>
 Since we have to have the canvas html element rendered in the page before invoking the library we use `OnAfterRenderAsync` to do our logic and call the js library.
{{< highlight cs "linenos=table" >}}
@*//Chart.razor*@
@inject IJSRuntime JSRuntime

<canvas id="@Id"></canvas>

@code {
    public enum ChartType
    {
        Pie,
        Bar
    }

    [Parameter]
    public string Id { get; set; }

    [Parameter]
    public ChartType Type { get; set; }

    [Parameter]
    public string[] Data { get; set; }

    [Parameter]
    public string[] BackgroundColor { get; set; }

    [Parameter]
    public string[] Labels { get; set; }

    protected override async Task OnAfterRenderAsync(bool firstRender) 
    {
        //Here we create an anonymous type with all the options that need to be sent to Chart.js
        var config = new
        {
            Type = Type.ToString().ToLower(),
            Options = new
            {
                Responsive = true,
                Scales = new
                {
                    YAxes = new[]
                    {
                        new { Ticks = new {
                            BeginAtZero=true
                        } }
                    }
                }
            },
            Data = new
            {
                Datasets = new[]
                {
                    new { Data = Data, BackgroundColor = BackgroundColor}
                },
                Labels = Labels
            }
        };

        await JSRuntime.InvokeVoidAsync("setup", Id, config);
    }
}
{{< / highlight>}}

##### Calling setup()

We create a new javascript file called `chart.js` which initializes our Chart js component in a function called `setup()`. It receives the canvas Id and the config options from the blazor component.

{{< highlight js "linenos=table" >}}
//chart.js
window.setup = (id,config) => {
    var ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, config);
}
{{< / highlight>}}

and then we add chart.js to index.html

{{< highlight html "linenos=table,hl_lines=3" >}}
<!--index.html-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js"></script>
<script src="chart.js"></script>
{{< / highlight>}}

## Using the new component

Now we have our `<Chart>` component ready to be used. Simply add the tag to a new page/component E.g.
{{< highlight html "linenos=table" >}}
<Chart Id="pie1" Type="@Chart.ChartType.Pie" Data="@(new[] { "1", "2" })" BackgroundColor="@(new[] { "blue","green"})" Labels="@(new[] { "Fail","Ok"})"></Chart>
<Chart Id="bar1" Type="@Chart.ChartType.Bar" Data="@(new[] { "10", "9" })" BackgroundColor="@(new[] { "yellow","red"})" Labels="@(new[] { "Fail","Ok"})"></Chart>
{{< / highlight>}}

![alt text](/imgs/2020/003-component.png# center border "Page")
<div class="text-center">_Our component is not setting the dataset label option therefore **undefined** is rendered._</div>


## Conclusion

This is a bare bone implementation that can be used as a blueprint if you want to extend it. Chart.js offers many different options to render the charts and they just need to be mapped in our anonymous class. E.g. If we want to create a property that holds the dataset label (and remove **undefined** from our rendered object) we would have something like this
{{< highlight cs "linenos=table,hl_lines=23" >}}
var config = new
{
    Type = Type.ToString().ToLower(),
    Options = new
    {
        Responsive = true,
        Scales = new
        {
            YAxes = new[]
            {
                new { Ticks = new {
                    BeginAtZero=true
                } }
            }
        }
    },
    Data = new
    {
        Datasets = new[]
        {
            new { Data = Data, 
                    BackgroundColor = BackgroundColor, 
                    Label=YourNewLabelProperty}
        },
        Labels = Labels
    }
};
{{< / highlight>}}

_Happy Coding!!_ :smiley::computer:<br>
_William Leme_