---
title: "Running Sql Server on a Raspberry Pi using Docker"
date: 2021-01-04T14:12:29-05:00
draft: false
tags: ["docker","devops","iot"]
---

Sql Server for linux has been around for a bit but it's only designed for x86 architectures which means not compatible with ARM therefore not possible to use it on a raspberry pi. 

but then Microsoft introduced [**Azure Sql Edge**](https://docs.microsoft.com/en-us/azure/azure-sql-edge/overview)

>What is Azure SQL Edge?
>
>Azure SQL Edge is an optimized relational database engine geared for IoT and IoT Edge deployments. It provides capabilities to create a high-performance data storage and processing layer for IoT applications and solutions. Azure SQL Edge provides capabilities to stream, process, and analyze relational and non-relational such as JSON, graph and time-series data, which makes it the right choice for a variety of modern IoT applications.
>
>Azure SQL Edge is built on the latest versions of the SQL Server Database Engine, which provides industry-leading performance, security and query processing capabilities. Since Azure SQL Edge is built on the same engine as SQL Server and Azure SQL, it provides the same Transact-SQL (T-SQL) programming surface area that makes development of applications or solutions easier and faster, and makes application portability between IoT Edge devices, data centers and the cloud straight forward.

and most important it's compatible with ARM architectures

#### Installing it on a raspberry pi using docker

##### Assumptions

You have a raspberry pi running ubuntu with docker properly setup

##### Pulling docker image and running it

We need to pull the official image from *mcr.microsoft.com/azure-sql-edge* and create a container. I have a docker-compose file taking care of its initialization: 

{{< highlight txt "linenos=table,hl_lines=7" >}}
# docker-compose.yml:
version: '3'
services:
  mssql:
    image: mcr.microsoft.com/azure-sql-edge
    container_name: "mssql"
    user: root
    restart: always
    environment:
      ACCEPT_EULA: Y
      MSSQL_SA_PASSWORD: !your_password_here@
    volumes:
      - ./data/mssql/data/:/var/opt/mssql/data
      - ./data/mssql/log/:/var/opt/mssql/log
      - ./data/mssql/secrets/:/var/opt/mssql/secrets
    ports:
      - 1433:1433
{{< /highlight >}}

The most important thing to know is that Azure SQL Edge containers run with a non-root user meaning you need to give permission to the volumes specified above. Just chown the volume folders to whatever uid the container is using by default **or** use *user: root* as specified at line #7. This approach is the simplest one if you are using sql server as your dev db server.

#### Connecting from outside the container / raspberry pi

Since we are exposing port number 1433 outside the boundaries of the container, it's available to be accessed by any tool. Eg. HeidiSql
