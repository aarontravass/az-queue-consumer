import { DequeuedMessageItem, QueueServiceClient } from '@azure/storage-queue'

/**
 * @type {Function}
 * @param {DequeuedMessageItem[]} messages
 */
export type HandlerFunction = (messages: DequeuedMessageItem[]) => void

export type QueueConnection = string | QueueServiceClient
