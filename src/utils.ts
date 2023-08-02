import { DequeuedMessageItem } from '@azure/storage-queue'

export interface QueueOptions {
  pollingTime: number
  maxTries?: number
  numberOfMessages?: number
}

export class QueueError extends Error {
  code: string
  message: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.message = message
  }
}

export type HandlerFunction = (messages: DequeuedMessageItem[]) => void

export const eventName = (context: string, event: string) => `${context}::${event}`
