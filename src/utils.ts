import { DequeuedMessageItem } from '@azure/storage-queue'

/**
 * QueueOptions interface
 * @interface
 */
export interface QueueOptions {
  /**
   * Polling time in seconds
   * @default 10
   */
  pollingTime: number
  /**
   * Maximum number of times to try
   * @default 4
   */
  maxTries?: number
  /**
   * Number of messages to receieve
   * @default 1
   */
  numberOfMessages?: number
}

export class QueueError extends Error {
  code: string
  message: string
  constructor(code: string, message: string) {
    super(`${code}:${message}`)
    this.code = code
    this.message = message
  }
}

/**
 * @type {Function}
 * @param {DequeuedMessageItem[]} messages
 */
export type HandlerFunction = (messages: DequeuedMessageItem[]) => void
