import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { QUEUE_MESSAGE } from './fixtures/Message'
import { AzureQueueConsumer } from '../src'
import { DequeuedMessageItem, QueueServiceClient } from '@azure/storage-queue'
import { flushPromises } from './helper/helper'

vi.mock('@azure/storage-queue', () => {
  const QueueServiceClient = vi.fn()
  QueueServiceClient.fromConnectionString = vi.fn((...args) => {
    const getQueueClient = vi.fn(() => {
      const createIfNotExists = vi.fn(() => new Promise((resolve) => resolve('this')))
      const receiveMessages = vi.fn(() => new Promise((resolve) => resolve(QUEUE_MESSAGE)))
      const deleteMessage = vi.fn(
        (messageId: string, popReceipt: string) => new Promise((resolve) => resolve(messageId))
      )
      return { createIfNotExists, receiveMessages, deleteMessage }
    })
    return { getQueueClient }
  })

  return { QueueServiceClient }
})

describe('azure queue tests', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  afterAll(() => {
    vi.resetAllMocks()
  })
  describe('initialization tests', () => {
    it('should initialize the queue', async () => {
      expect.assertions(2)
      const handler = vi.fn((r) => {})
      const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
      listener.on('queue::ready', handler)
      await flushPromises()
      expect(handler).toBeCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('this')
    })
    it.skip('should throw an error if queue could not be initialized', async () => {
      expect.assertions(1)

      const errorToThrow = { code: 'code', message: 'message' }

      try {
        vi.spyOn(QueueServiceClient, 'fromConnectionString').mockImplementation((...args) => {
          const getQueueClient = vi.fn(() => {
            const createIfNotExists = vi.fn(() => new Promise((resolve, reject) => reject(errorToThrow)))

            return { createIfNotExists }
          })
          return { getQueueClient }
        })

        const k = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        await flushPromises()
      } catch (error) {
        console.error(error)
      }
    })
  })
  describe('listener tests', () => {
    it('should test for queue message', async () => {
      expect.assertions(2)
      const handler = vi.fn((messages) => {})
      const listener = new AzureQueueConsumer('test', 'https://test.com', handler)
      listener.listen()
      await flushPromises()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(QUEUE_MESSAGE.receivedMessageItems)
    })
    describe('listener event tests', () => {
      it('should emit event when message is received', async () => {
        expect.assertions(2)
        const handler = vi.fn((messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::onReceive', handler)
        listener.listen()

        await flushPromises()
        expect(handler).toBeCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(QUEUE_MESSAGE)
      })
      it('should emit event when handler completes execution', async () => {
        expect.assertions(2)
        const handler = vi.fn(() => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('handler::finish', handler)
        listener.listen()
        await flushPromises()
        expect(handler).toBeCalledTimes(1)
        expect(handler).toHaveBeenCalledWith()
      })
      it('should emit event when handler fails', async () => {
        expect.assertions(2)
        const handler = vi.fn((messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {
          throw 'error'
        })
        listener.on('handler::error', handler)
        listener.listen()

        await flushPromises()
        expect(handler).toHaveBeenCalledWith('error')
        expect(handler).toHaveBeenCalledTimes(1)
      })
    })
  })
  describe('delete message tests', () => {
    describe('delete message fn event tests', () => {
      it('should emit an event before deleting a specific message', async () => {
        expect.assertions(3)
        const handler = vi.fn((messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::preDelete', handler)
        listener.listen()

        await flushPromises()

        expect(handler).toHaveBeenNthCalledWith(
          1,
          QUEUE_MESSAGE.receivedMessageItems[0].messageId,
          QUEUE_MESSAGE.receivedMessageItems[0].popReceipt
        )
        expect(handler).toHaveBeenNthCalledWith(
          2,
          QUEUE_MESSAGE.receivedMessageItems[1].messageId,
          QUEUE_MESSAGE.receivedMessageItems[1].popReceipt
        )
        expect(handler).toHaveBeenCalledTimes(2)
      })
      it('should emit an event after deleting a specific message', async () => {
        expect.assertions(3)
        const handler = vi.fn((messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::afterDelete', handler)
        listener.listen()
        await flushPromises()
        expect(handler).toHaveBeenNthCalledWith(1, QUEUE_MESSAGE.receivedMessageItems[0].messageId)
        expect(handler).toHaveBeenNthCalledWith(2, QUEUE_MESSAGE.receivedMessageItems[1].messageId)
        expect(handler).toHaveBeenCalledTimes(2)
      })
    })
  })
})
