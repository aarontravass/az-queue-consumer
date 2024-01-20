<div align="center">
<h1>Azure Queue Consumer</h1>

[![main](https://github.com/aarontravass/azure-queue-storage-consumer/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/aarontravass/azure-queue-storage-consumer/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/aarontravass/azure-queue-storage-consumer/branch/main/graph/badge.svg?token=Agx0UiAO5s)](https://codecov.io/gh/aarontravass/azure-queue-storage-consumer)
[![npm version](https://badge.fury.io/js/az-queue-consumer.svg)](https://badge.fury.io/js/az-queue-consumer)
![NPM License](https://img.shields.io/npm/l/az-queue-consumer)
[![CodeFactor](https://www.codefactor.io/repository/github/aarontravass/az-queue-consumer/badge)](https://www.codefactor.io/repository/github/aarontravass/az-queue-consumer)
![TypeScript types](https://badgen.net/npm/types/az-queue-consumer)
<hr>
</div>

Azure Queue Consumer is a simple, typescript first consumer that allows you to handle queue messages without having to worry about setting up the azure framework.

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
## API

`listen` - The listen function starts the listener which in turns polls the queue every 10 seconds. The default, which is 10 seconds, can be chaged by setting `pollingTime` in options in the constructor.

`on` - Adds a event listener for specific events. Events are typed and custom handlers need to be passed. See below for full list of events

`stop` - Stops the listener and completes execution of any ongoing handler before quitting. 

## Events

* `queue::ready` - emitted when the client connects to the queue and is ready to receive messages
* `message::onReceive` - this event is emitted when the client receives a message
* `handler::finish` - once the handler finishes executing, this event is emitted
* `handler::error` - if the handler fails with an exception, the exception is emitted along with this event
* `listener::error` - the listener can encounter errors even after connecting such as connection errors. This event gets emitted during such as errors
* `message::preDelete` - Before deleting the message, this event is fired
* `message::afterDelete` - After successful deletion, this event gets fired
* `queue::shutdown` - when `stop()` is called, the queue emits this event and finished executing the current message

## Credits

Inspired by [sqs-consumer](https://github.com/bbc/sqs-consumer)