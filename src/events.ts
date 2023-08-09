import {
  MessageIdDeleteResponse,
  QueueCreateIfNotExistsResponse,
  QueueReceiveMessageResponse
} from '@azure/storage-queue'
import { EventEmitter } from 'node:events'

interface Events {
  'queue::ready': (response: QueueCreateIfNotExistsResponse) => void
  'message::onReceive': (response: QueueReceiveMessageResponse) => void
  'handler::finish': () => void
  'handler::error': (error: Error) => void
  'listener::error': (error: Error) => void
  'message::preDelete': (messageId: string, popReceipt: string) => void
  'message::afterDelete': (response: MessageIdDeleteResponse) => void
  'queue::shutdown': () => void
}

export class QueueEventEmitter {
  #emitter = new EventEmitter()
  on = <K extends keyof Events>(event: K, handler: Events[K]): void => {
    this.#emitter.on.bind(this)(event, handler)
  }

  protected emit = <K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void => {
    this.#emitter.emit.bind(this)(event, ...args)
  }

  protected removeAllListeners = () => {
    this.#emitter.removeAllListeners()
  }
}
