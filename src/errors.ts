export class QueueError extends Error {
  code: string
  message: string
  constructor(code: string, message: string) {
    super(`${code}:${message}`)
    this.code = code
    this.message = message
  }
}

export class QueueConnectionError extends Error {
  code: string
  message: string
  constructor(code: string, message: string) {
    super(`${code}:${message}`)
    this.code = code
    this.message = message
  }
}
