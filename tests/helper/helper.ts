import { DequeuedMessageItem, QueueCreateIfNotExistsResponse, QueueReceiveMessageResponse } from '@azure/storage-queue'

export class QueueService {
  readonly messages: DequeuedMessageItem[] = [
    {
      messageId: 'abcderhbub',
      insertedOn: new Date(),
      expiresOn: new Date(),
      popReceipt: '#6788888',
      nextVisibleOn: new Date(),
      dequeueCount: 0,
      messageText: '{"hello":"world","a":5}'
    },
    {
      messageId: 'gjhcvf',
      insertedOn: new Date(),
      expiresOn: new Date(),
      popReceipt: '#1234',
      nextVisibleOn: new Date(),
      dequeueCount: 0,
      messageText: '{"world":"hello","a":5}'
    }
  ]
  queueMessage: DequeuedMessageItem[] = []
  constructor() {
    this.queueMessage = this.messages
  }

  deleteMessage = (messageId: string) => {
    this.queueMessage = this.queueMessage.filter((message) => message.messageId != messageId)
  }

  restoreMessages = () => {
    this.queueMessage = this.messages
  }

  fetchMessages = (count: number): QueueReceiveMessageResponse => ({
    receivedMessageItems: this.queueMessage.slice(0, Math.min(count, this.queueMessage.length)),
    _response: undefined,
    errorCode: undefined
  })

  createQueue = (): QueueCreateIfNotExistsResponse => ({ succeeded: true, _response: undefined })
}

export const flushPromises = async () => await new Promise(process.nextTick)
