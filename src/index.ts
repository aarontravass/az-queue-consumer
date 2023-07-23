import { DequeuedMessageItem, QueueClient, QueueServiceClient } from '@azure/storage-queue'
import { EventEmitter } from 'node:events'
import { QueueError, QueueOptions } from './utils'

export class AzureQueueConsumer {
  readonly #queueName: string
  readonly #connectionString: string
  #options: QueueOptions
  #handler: Function
  #queueClient: QueueClient
  #eventEmitter = new EventEmitter()
  #pollingTime: number
  constructor(queueName: string, connectionString: string, handler: Function, options?: QueueOptions) {
    this.#connectionString = connectionString
    this.#queueName = queueName
    this.#handler = handler
    this.#options = options ?? { pollingTime: 10 }
    this.#options.maxTries = this.#options.maxTries ?? 4
    this.#options.numberOfMessages = this.#options.numberOfMessages ?? 1
    const queueServiceClient = QueueServiceClient.fromConnectionString(this.#connectionString, {
      retryOptions: { maxTries: this.#options.maxTries }
    })
    this.#queueClient = queueServiceClient.getQueueClient(this.#queueName)
    this.#pollingTime = this.#options.pollingTime
    this.#createQueueAsync()
  }

  #createQueueAsync = async () => {
    await this.#queueClient.createIfNotExists()
  }

  listen = () => {
    let pollingTimeOut = this.#pollingTime
    this.#queueClient
      .receiveMessages()
      .then(async (result) => {
        console.log(result._response)
        if (result.errorCode) throw new QueueError(result.errorCode, 'something went wrong')
        this.#eventEmitter.emit('message::onReceive')
        let hasHandlerFinished = false
        try {
          await this.#handler(result.receivedMessageItems)
          this.#eventEmitter.emit('handler::finish')
          hasHandlerFinished = true
        } catch (error) {
          this.#eventEmitter.emit('handler::error', error)
        }
        if (hasHandlerFinished) await this.#deleteMessages(result.receivedMessageItems)
      })
      .catch((error) => {
        return
      })
      .then((_) => {
        setTimeout(this.listen.bind(this), pollingTimeOut * 1000)
      })
      .catch((error) => {
        this.#eventEmitter.emit('error', error)
        process.exit(1)
      })
  }

  $on = this.#eventEmitter.on

  #deleteMessages = async (messages: DequeuedMessageItem[]) => {
    for (const message of messages) {
      this.#eventEmitter.emit('message::preDelete', message.messageId, message.popReceipt)
      await this.#queueClient.deleteMessage(message.messageId, message.popReceipt).then((_) => {
        this.#eventEmitter.emit('message::afterDelete', message.messageId, message.popReceipt)
      })
    }
  }
}
