import { DequeuedMessageItem, QueueClient, QueueServiceClient } from '@azure/storage-queue'
import { EventEmitter } from 'node:events'
import { HandlerFunction, QueueError, QueueOptions, eventName } from './utils'

export class AzureQueueConsumer {
  #options: QueueOptions
  #handler: HandlerFunction
  #queueClient: QueueClient
  #eventEmitter = new EventEmitter()
  #pollingTime: number
  constructor(queueName: string, connectionString: string, handler: HandlerFunction, options?: QueueOptions) {
    this.#handler = handler
    this.#options = options ?? { pollingTime: 10 }
    this.#options.maxTries = this.#options.maxTries ?? 4
    this.#options.numberOfMessages = this.#options.numberOfMessages ?? 1
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString, {
      retryOptions: { maxTries: this.#options.maxTries }
    })
    this.#queueClient = queueServiceClient.getQueueClient(queueName)
    this.#pollingTime = this.#options.pollingTime
    this.#createQueueAsync()
  }

  #createQueueAsync = async () => {
    await this.#queueClient
      .createIfNotExists()
      .then((res) => {
        this.#eventEmitter.emit.bind(this)(eventName('queue', 'ready'), res)
      })
      .catch((er) => {
        throw new QueueError(er.code, er.message)
      })
  }

  listen = () => {
    this.#queueClient
      .receiveMessages()
      .then(async (result) => {
        if (result.errorCode) throw new QueueError(result.errorCode, 'something went wrong')
        this.#eventEmitter.emit.bind(this)(eventName('message', 'onReceive'), result)
        let hasHandlerFinished = false
        try {
          await this.#handler(result.receivedMessageItems)
          this.#eventEmitter.emit.bind(this)(eventName('handler', 'finish'))
          hasHandlerFinished = true
        } catch (error) {
          this.#eventEmitter.emit.bind(this)(eventName('handler', 'error'), error)
        }
        if (hasHandlerFinished) await this.#deleteMessages(result.receivedMessageItems)
        this.#pollingTime = this.#options.pollingTime
      })
      .catch((error) => {
        if (error.code === 'REQUEST_SEND_ERROR') this.#pollingTime += 5
        return
      })
      .then((_) => {
        setTimeout(this.listen.bind(this), this.#pollingTime * 1000)
      })
      .catch((error) => {
        this.#eventEmitter.emit.bind(this)(eventName('listener', 'error'), error)
        process.exit(1)
      })
  }

  on = this.#eventEmitter.on

  #deleteMessages = async (messages: DequeuedMessageItem[]) => {
    for (const message of messages) {
      this.#eventEmitter.emit.bind(this)(eventName('message', 'preDelete'), message.messageId, message.popReceipt)
      await this.#queueClient.deleteMessage(message.messageId, message.popReceipt).then((res) => {
        this.#eventEmitter.emit.bind(this)(eventName('message', 'afterDelete'), res)
      })
    }
  }
}
