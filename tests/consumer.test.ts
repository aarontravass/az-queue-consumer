import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { AzureQueueConsumer } from '../src'
import { QueueServiceClient } from '@azure/storage-queue'
import { flushPromises, QueueService } from './helper/helper'

const queueService = new QueueService()

vi.mock('@azure/storage-queue', () => {
  const QueueServiceClient = vi.fn()
  QueueServiceClient['fromConnectionString'] = vi.fn((...args) => {
    const getQueueClient = vi.fn(() => {
      const createIfNotExists = vi.fn(() => new Promise((resolve) => resolve(queueService.createQueue())))
      const receiveMessages = vi.fn(() => new Promise((resolve) => resolve(queueService.fetchNMessages(2))))
      const deleteMessage = vi.fn(
        (messageId: string, popReceipt: string) =>
          new Promise((resolve) => resolve(queueService.deleteMessage(messageId)))
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
    queueService.restoreMessages()
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
      expect(handler).toHaveBeenCalledWith({
        _response: undefined,
        succeeded: true
      })
    })
    it.skip('should throw an error if queue could not be initialized', async () => {
      expect.assertions(1)

      const errorToThrow = { code: 'code', message: 'message' }

      try {
        vi.spyOn(QueueServiceClient, 'fromConnectionString').mockImplementation((..._args: string[]) => {
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
      const handler = vi.fn((_messages) => {})
      const listener = new AzureQueueConsumer('test', 'https://test.com', handler)
      listener.listen()
      await flushPromises()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(queueService.fetchNMessages(2).receivedMessageItems)
    })
    describe('listener event tests', () => {
      it('should emit event when message is received', async () => {
        expect.assertions(2)
        const handler = vi.fn((_messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::onReceive', handler)
        listener.listen()

        await flushPromises()
        expect(handler).toBeCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(queueService.fetchNMessages(2))
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
        const handler = vi.fn((_messages) => {})
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
        const handler = vi.fn((_messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::preDelete', handler)
        listener.listen()

        await flushPromises()

        expect(handler).toHaveBeenNthCalledWith(
          1,
          queueService.fetchNMessages(2).receivedMessageItems[0].messageId,
          queueService.fetchNMessages(2).receivedMessageItems[0].popReceipt
        )
        expect(handler).toHaveBeenNthCalledWith(
          2,
          queueService.fetchNMessages(2).receivedMessageItems[1].messageId,
          queueService.fetchNMessages(2).receivedMessageItems[1].popReceipt
        )
        expect(handler).toHaveBeenCalledTimes(2)
      })
      it('should emit an event after deleting a specific message', async () => {
        expect.assertions(3)
        const handler = vi.fn((_messages) => {})
        const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        listener.on('message::afterDelete', handler)
        listener.listen()
        await flushPromises()
        expect(handler).toHaveBeenNthCalledWith(1, {
          _response: undefined,
          errorCode: undefined
        })
        expect(handler).toHaveBeenNthCalledWith(2, {
          _response: undefined,
          errorCode: undefined
        })
        expect(handler).toHaveBeenCalledTimes(2)
      })
    })
  })
})
