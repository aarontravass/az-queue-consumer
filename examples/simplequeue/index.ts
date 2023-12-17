import { AzureQueueConsumer } from 'az-queue-consumer'
import { readFileSync } from 'node:fs'
import { EOL } from 'node:os'

// read .env file
;(() =>
  readFileSync('./.env', { encoding: 'utf-8' })
    .toString()
    .split(EOL)
    .forEach((env) => {
      for (let end = 0; end < env.length; end++) {
        if (env.charAt(end) == '=') {
          const key = env.slice(0, end)
          let value = env.slice(end + 1)
          if (value.charAt(0) == "'") value = value.slice(1)
          if (value.charAt(value.length - 1) == "'") value = value.slice(0, value.length - 1)
          process.env[key] = value
          break
        }
      }
    }))()

const client = new AzureQueueConsumer(
  process.env.AZURE_QUEUE_NAME!,
  process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING!,
  (messages) => {
    console.log(messages)
  }
)
client.listen()
