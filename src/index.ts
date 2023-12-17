import { DequeuedMessageItem, QueueClient, QueueServiceClient } from '@azure/storage-queue'
import { QueueConnectionError, QueueError } from './errors'
import { QueueEventEmitter } from './events'
import { HandlerFunction, QueueOptions, QueueConnection } from './types'

/**
 * The Main Queue Consumer class
 * @class
 * @example
 * import { AzureQueueConsumer } from 'az-queue-consumer';
 * const messageHandler = (messages) => { // do something with the message }
 * const queueName = // queue name;
 * const connectionString = // storage account connection string;
 * const listener = new AzureQueueConsumer(queueName, connectionString, messageHandler);
 * listener.listen();
 */
export class AzureQueueConsumer extends QueueEventEmitter {
  #options: QueueOptions
  #handler: HandlerFunction
  #queueClient: QueueClient
  #pollingTime: number
  #shouldShutdown = false

  /**
   *
   * @param {string} queueName - the name of the queue to connect
   * @param {(string|QueueServiceClient)} connection
   * @param {Function} handler - A function to handle queue messages
   * @param {Object=} options
   * @param {number} options.pollingTime - Polling time in seconds for the queue
   * @param {number=} options.maxTries - Maximum number of times to try before exiting
   * @param {number=} options.numberOfMessages - Number of messages to accept from the queue
   */
  constructor(queueName: string, connection: QueueConnection, handler: HandlerFunction, options?: QueueOptions) {
    super()
    this.#handler = handler
    this.#options = options ?? { pollingTime: 10 }
    this.#options.maxTries = this.#options.maxTries ?? 4
    this.#options.numberOfMessages = this.#options.numberOfMessages ?? 1
    this.#queueClient = this.#getQueueClient(connection, queueName)
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

  /**
   * The main listener method which polls the queueu and passes incoming messages to
   * the supplied handler function
   * @property
   */
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
      .then(() => {
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

  /**
   * Calling this function stops the queue and shuts it down. Before stopping, all currently
   * running handler functions are completed and messages deleted
   * @property
   */
  stop = () => {
    this.#shouldShutdown = true
    this.emit('queue::shutdown')
  }

  #getQueueClient = (connection: QueueConnection, queueName: string) => {
    let queueServiceClient: QueueServiceClient
    if (typeof connection == 'string') {
      queueServiceClient = QueueServiceClient.fromConnectionString(connection, {
        retryOptions: { maxTries: this.#options.maxTries }
      })
    } else if ('connectionString' in connection && 'credential' in connection) {
      queueServiceClient = new QueueServiceClient(connection.connectionString, connection.credential)
    } else if (connection instanceof QueueServiceClient) {
      queueServiceClient = connection
    } else {
      throw new QueueConnectionError('INVALID_CONNECTION', 'Queue Connection provided was invalid')
    }
    return queueServiceClient.getQueueClient(queueName)
  }
}
