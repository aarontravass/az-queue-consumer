import { QueueClient, QueueServiceClient } from "@azure/storage-queue";

export interface QueueOptions {
  pollingTime: number;
  autoDequeue: boolean;
}

export class AzureQueueConsumer {
  readonly #queueName: string;
  readonly #connectionString: string;
  #options: QueueOptions;
  #handler: Function;
  #queueClient: QueueClient;

  constructor(
    queueName: string,
    connectionString: string,
    handler: Function,
    options?: QueueOptions
  ) {
    this.#connectionString = connectionString;
    this.#queueName = queueName;
    this.#handler = handler;
    this.#options = options ?? { pollingTime: 10, autoDequeue: true };

    const queueServiceClient = QueueServiceClient.fromConnectionString(this.#connectionString);
    this.#queueClient = queueServiceClient.getQueueClient(this.#queueName);
    this.#createQueueAsync();
  }

  #createQueueAsync = async () => {
    await this.#queueClient.createIfNotExists();
  }

  listen = () => {

  };

  

  #handleIncomingMessage = async () => {
    try {
      return await this.#queueClient.receiveMessages();
    } catch (error) {}
  };
}
