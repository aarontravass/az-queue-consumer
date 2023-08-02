<div align="center">
<h1>Azure Queue Consumer</h1>

[![main](https://github.com/aarontravass/azure-queue-storage-consumer/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/aarontravass/azure-queue-storage-consumer/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/aarontravass/azure-queue-storage-consumer/branch/main/graph/badge.svg?token=Agx0UiAO5s)](https://codecov.io/gh/aarontravass/azure-queue-storage-consumer)

<hr>
</div>

Azure Queue Consumer is a simple consumer that allows you to handle queue messages without having to worry about setting up the azure framework.

## Installation

Node 18+ is required

```pnpm i az-queue-consumer ```

or

```npm i az-queue-consumer```

## Examples
```ts

import { AzureQueueConsumer } from 'az-queue-consumer';

const messageHandler = (messages) => {
  // do something with the message
}
const queueName = "sample-queue";
const connectionString = "DefaultEndpointsProtocol=https;AccountName=something;AccountKey=something==;EndpointSuffix=core.windows.net";
const listener = new AzureQueueConsumer(queueName, connectionString, messageHandler);

listener.on('queue::ready', () => { console.log("Listener is ready to receive messages!") });

listener.listen();

```

## Credits

Inspired by [sqs-consumer](https://github.com/bbc/sqs-consumer)