import {
  AnonymousCredential,
  DequeuedMessageItem,
  QueueServiceClient,
  StorageSharedKeyCredential
} from '@azure/storage-queue'

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

/**
 * @type {Function}
 * @param {DequeuedMessageItem[]} messages
 */
export type HandlerFunction = (messages: DequeuedMessageItem[]) => void | Promise<void>

/**
 * Azure Credential Type which is used to initialize `QueueServiceClient`
 * @example
 * new QueueServiceClient(AzureCredential.connectionString, AzureCredential.credential)
 * @type {object}
 * @property {string} connectionString - Account Connection String
 * @property {object} credential - instance of Azure Credentials. Can be `DefaultAzureCredential`, `StorageSharedKeyCredential`, etc.
 */

export type AzureCredential = {
  /**
   * URL of your queue
   * @example
   * `https://{accountName}.blob.core.windows.net`
   */
  queueUrl: string
  /**
   * Instance of Credential class which holds the authorization needed
   * @example
   * new DefaultAzureCredential() or
   * new AnonymousCredential() or
   * new StorageSharedKeyCredential(account, accountKey)
   */
  credential: StorageSharedKeyCredential | AnonymousCredential
}

export type QueueConnection = string | QueueServiceClient | AzureCredential
