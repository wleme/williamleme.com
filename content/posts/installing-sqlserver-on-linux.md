---
title: "Installing SqlServer on Linux"
description: "How to install sqlserver on a linux box using docker"
date: 2018-12-08T06:37:27-05:00
draft: false
seq: 0002
#images: ["/imgs/0002 - sql server on linux cover.png"]
cover: /imgs/0002 - sql server and linux.png#center 
categories: [DevOps]
---
### In this tutorial we will pull a Sql Server docker image, create a docker-compose script and connect to this new server using SSMS (sql server management studio)
I keep all my databases, queues and other infrastructure tools on a linux box running as docker containers. Docker gives me the flexibility of installing multiple things 
without messing up my dev environment and I recently added SqlServer

#### Pull the docker image into your linux box
{{< highlight terminal>}}
sudo docker pull mcr.microsoft.com/mssql/server
{{< /highlight>}}

#### Install docker compose (if you don't have it)
{{< highlight terminal>}}
sudo curl -L "https://github.com/docker/compose/releases/download/1.23.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
{{< /highlight>}}
 
#### Create a new docker-compose.yml file
{{< highlight terminal>}}
sudo nano docker-compose.yml
{{< /highlight>}}
and type the following: (The configuration below will run the slq server container in the developer edition)
{{< highlight terminal "linenos=table,hl_lines=4 6 8-9 11 13">}}
version: '3'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:latest
    container_name: sqlserver1
    restart: always
    environment:
      - "ACCEPT_EULA=Y"
      - "MSSQL_SA_PASSWORD=<YourStrong!Passw0rd>"
    volumes:
      - ./data/sqlserver1/:/var/opt/mssql
    ports:
      - "1433:1433"
{{< /highlight>}} 

* Line 4 - Specifies the docker image we have just pulled.
* Line 6 - Tells the container it will always be restarted.
* Line 8-9 - Specific variables required by Sql Server. Note we are supplying the sa password here.
* Line 11 - It specifies where the data will be persisted. If you don't specify anything here and remove the sql server container you will lose all the data.
* Line 13 - It exposes the container outside the docker. You want to map the port otherwise you won't have access to sql server from your dev environment.


now we can start docker compose
{{< highlight terminal >}}
sudo docker-compose up
{{< /highlight>}}

and make sure sql server is up
{{< highlight terminal >}}
sudo docker ps -a
{{< /highlight>}}
you should see the following
![alt text](/imgs/0002 - sql server on linux.jpg "SqlServer")

#### Connecting via SSMS
Now that the server is up and running and the container is exposed to connections outside the docker, we are able to use it normally and connect to it via SSMS or our application.



