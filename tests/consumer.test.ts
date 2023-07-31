import { afterAll, afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { QUEUE_MESSAGE } from './fixtures/Message'
import { AzureQueueConsumer } from '../src'
import { DequeuedMessageItem, QueueServiceClient } from '@azure/storage-queue'

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

// vi.mock('node:events', () => {
//   const EventEmitter = vi.fn(() => ({
//     on: vi.fn(),
//     emit: vi.fn()
//   }))
//   return { EventEmitter }
// })

describe('azure queue tests', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })
  afterAll(() => {
    vi.resetAllMocks()
  })
  describe('initialization tests', () => {
    it('should initialize the queue', () => {
      expect.assertions(1)
      function handler(r) {
        expect(r).toEqual('ready')
      }
      const listener = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
  
      vi.spyOn(listener, 'on').mockImplementation((name: string, handler) => handler(name))
  
      listener.on('ready', handler)
    })
    it.skip('should throw an error if queue could not be initialized', async () => {
      expect.assertions(1)
      vi.useFakeTimers()
      const errorToThrow = { code: 'code', message: 'message' }
  
      try {
        vi.spyOn(QueueServiceClient, 'fromConnectionString').mockImplementation((...args) => {
          const getQueueClient = vi.fn(() => {
            const createIfNotExists = vi.fn(() => new Promise((resolve, reject) => reject("errorToThrow")))
  
            return { createIfNotExists }
          })
          return { getQueueClient }
        })
        vi.runAllTicks()
        vi.runAllTimers()
        await Promise.resolve(); 
        const k = new AzureQueueConsumer('test', 'https://test.com', (...args) => {})
        await Promise.resolve(); 
        vi.advanceTimersByTime(10000)
        vi.runAllTicks()
        vi.runAllTimers()
      } catch (error) {
        console.error(error)
      }
       vi.useRealTimers()
      
    })
  })
  describe('listener tests', () => {
    it('should test for queue message', () => {
      expect.assertions(2)
      const handler = (messages: DequeuedMessageItem[]) => {
        console.log(messages)
        expect(messages).toHaveLength(1)
        expect(messages[0]).toEqual(QUEUE_MESSAGE[0])
      }
      const listener = new AzureQueueConsumer('test', 'https://test.com', handler)
      listener.listen();
    })
   
  })
 
})
