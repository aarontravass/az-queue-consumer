import { DequeuedMessageItem, QueueClient, QueueServiceClient } from '@azure/storage-queue'
import { HandlerFunction, QueueError, QueueOptions } from './utils'
import { QueueEventEmitter } from './events'

export class AzureQueueConsumer extends QueueEventEmitter {
  #options: QueueOptions
  #handler: HandlerFunction
  #queueClient: QueueClient
  #pollingTime: number
  #shouldShutdown = false
  constructor(queueName: string, connectionString: string, handler: HandlerFunction, options?: QueueOptions) {
    super()
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
        this.emit('queue::ready', res)
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
        this.emit('message::onReceive', result)
        let hasHandlerFinished = false
        try {
          await this.#handler(result.receivedMessageItems)
          this.emit('handler::finish')
          hasHandlerFinished = true
        } catch (error) {
          this.emit('handler::error', error as Error)
        }
        if (hasHandlerFinished) await this.#deleteMessages(result.receivedMessageItems)
        this.#pollingTime = this.#options.pollingTime
      })
      .catch((error) => {
        if (error.code === 'REQUEST_SEND_ERROR') this.#pollingTime += 5
        return
      })
      .then((_) => {
        if (!this.#shouldShutdown) setTimeout(this.listen.bind(this), this.#pollingTime * 1000)
        else this.removeAllListeners()
      })
      .catch((error) => {
        this.emit('listener::error', error)
        process.exit(1)
      })
  }

  #deleteMessages = async (messages: DequeuedMessageItem[]) => {
    for (const message of messages) {
      this.emit('message::preDelete', message.messageId, message.popReceipt)
      await this.#queueClient.deleteMessage(message.messageId, message.popReceipt).then((res) => {
        this.emit('message::afterDelete', res)
      })
    }
  }

  stop = () => {
    this.#shouldShutdown = true
    this.emit('queue::shutdown')
  }
}
