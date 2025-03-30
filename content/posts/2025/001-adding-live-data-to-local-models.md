---
title: "Adding live data to Local SLMs"
#description: "How to access OAuth access tokens"
date: 2025-03-29
draft: true
tags: ["AI", ".Net"]
summary: "Adding live data to a local SLM running off a docker container in raspberry pi and preserving the context. We will build a .net console app that connects to the `Ollama` instance using the `Microsoft.Extensions.Ai` nuget package"
---

## What are we doing ?
We'll set up the `Ollama` Docker container and download a Small Language Model (SLM). Then, we'll build a .NET application that connects to the Ollama instance to chat with the user and fetch live weather data using `Microsoft.Extensions.Ai`. We'll also implement session persistence, so the app remembers past conversations the next time it's launched.

## Pulling Ollama docker image in docker compose + downloading SLM

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

```
docker compose up
```

Installing a small language model:
```
docker exec -it ollama ollama run llama3
```
See all models here: https://ollama.com/search. 
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

### Persisting the data
All the conversation is persisted in a local sqllite db. Whenever the app comes up again, we load the past conversations from it.

Note - As the context grows, it slows down the queries to the SLM tremendously in CPUs. 

Running a 3b Model in a CPU 😜
![alt text](/imgs/2025/001-cpu.png)

## References
https://hub.docker.com/r/ollama/ollama </br>
https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/chat-local-model </br>
https://github.com/dotnet/ai-samples/tree/main/src/microsoft-extensions-ai/ollama/OllamaExamples </br>
https://nominatim.openstreetmap.org (free weather api)