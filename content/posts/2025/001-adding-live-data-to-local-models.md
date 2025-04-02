---
title: "Adding live data to local language models"
date: 2025-03-29
draft: false
tags: ["AI", ".Net"]
summary: "Adding live data to a local SLM running off a docker container in raspberry pi and preserving the context. We will build a .net console app that connects to the `Ollama` instance using the `Microsoft.Extensions.Ai` nuget package"
---

## What are we doing ?
We will extend the capabilities of a local language model by adding the ability to pull live data from the internet.

## How are we doing ?

We'll set up the `Ollama` Docker container and download a Small Language Model (SLM). Then, we'll build a .NET application that connects to the Ollama instance to chat with the user and fetch live weather data using `Microsoft.Extensions.Ai`. We'll also implement session persistence, so the app remembers past conversations the next time it's launched.

## Pulling Ollama docker image in docker compose + downloading language model

```yml
#docker-compose.yml
version: '3'
services:
  ollama:
    image: ollama/ollama
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama/:/root/.ollama
```

```bash
docker compose up
```

The, installing a small language model:
```bash
docker exec -it ollama ollama run llama3
```
See all models here: https://ollama.com/search. 

The size of a language model is determined by the number of parameters:
| Language Model Size| Parameter Range       |
|------------|-----------------------|
| Tiny       | < 100M                |
| Small      | 100M – 1B             |
| Medium     | 1B – 10B              |
| Large      | 10B – 100B            |
| Very Large | 100B+                 |



## Building a c# chat client
We will use `Microsoft.Extensions.Ai` which abstracts the interactio between your app and different AI Provider (OpenaI, Azure OpenAI, local Langague models,..)

### Pulling live data
We leverage `Microsoft.Extensions.Ai` function invocations which lets you build custom functions to answer specific prompts. 
Any time there's a question about the current weather in a given location we will call `openstreetmap` weather api

```cs
//specifying which function(s) the chat will use 
 var chatOptions = new ChatOptions
 {
     Tools = [AIFunctionFactory.Create(GetCurrentWeather)] //function is defined below
 };

//define the client
IChatClient chatClient = new OllamaChatClient("http://192.168.0.233:11434", "llama3.2:3b")
    .AsBuilder()
    .UseFunctionInvocation()
    .Build();
```

#### Weather API function

We leverage `Openstreepmap` weather api
```cs
[Description("Get the current weather temperature for a given location around the world")]
static async Task<string> GetCurrentWeather(string city)
{
    var resp = await httpClient.SendAsync(new HttpRequestMessage(HttpMethod.Get, new Uri($"https://nominatim.openstreetmap.org/search?q={city}&format=json&limit=1")));
    resp.EnsureSuccessStatusCode();
    var data = await resp.Content.ReadAsStreamAsync();
    var locations = await System.Text.Json.JsonSerializer.DeserializeAsync<IList<CityCoordinates>>(data);
    if (locations.Count == 0)
        return "I do not recognize this location";

    if (locations.Count > 1)
        return "Be more specific";

    return await GetTemp(locations[0]);
}

static async Task<string> GetTemp(CityCoordinates cityCoordinates)
{
    var resp = await httpClient.SendAsync(new HttpRequestMessage(HttpMethod.Get, new Uri($"https://api.open-meteo.com/v1/forecast?latitude={cityCoordinates.Lat}&longitude={cityCoordinates.Lon}&current_weather=true&temperature_unit=fahrenheit")));
    resp.EnsureSuccessStatusCode();
    var data = await resp.Content.ReadAsStreamAsync();
    var temp = await System.Text.Json.JsonSerializer.DeserializeAsync<Temperature>(data);
    return "The weather for  " + cityCoordinates.Name + " is " + temp.WeatherInfo.Temp;
}
```
### Results

#### Without live data function
```text
Your prompt:
what's the weather in salt lake city

AI Response:
I couldn't retrieve the current weather in Salt Lake City, but I can suggest some ways to find out.
You can check online weather websites such as AccuWeather, Weather.com, or the National Weather Service (NWS) for the most up-to-date and accurate forecast for Salt Lake City. You can also download a weather app on your smartphone to get the latest weather conditions.
If you're looking for historical weather data or long-term forecasts, I recommend checking out the NWS website or using a reliable weather API.
Would you like me to suggest some alternative ways to find the current weather in Salt Lake City?
```
#### With live data function
```text
Your prompt:
what's the weather in salt lake city

AI Response:
The current temperature in Salt Lake City is approximately 39.5 degrees Fahrenheit.
```
### Persisting the data
All the conversation is persisted in a local `sqllite` db. Whenever the app comes up again, we load the past conversations from it.

Note - As the context grows, it slows down the queries to the SLM tremendously in CPUs. 

Running a 3b Model in a CPU 😜
![alt text](/imgs/2025/001-cpu.png)

## Source code
https://github.com/wleme/OllamaSample

## References
https://hub.docker.com/r/ollama/ollama </br>
https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/chat-local-model </br>
https://github.com/dotnet/ai-samples/tree/main/src/microsoft-extensions-ai/ollama/OllamaExamples </br>
https://nominatim.openstreetmap.org (free weather api)