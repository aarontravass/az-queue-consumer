import { QueueReceiveMessageResponse } from '@azure/storage-queue'

export const QUEUE_MESSAGE: QueueReceiveMessageResponse = {
  receivedMessageItems: [
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
  ],
  _response: undefined,
  errorCode: undefined
}
