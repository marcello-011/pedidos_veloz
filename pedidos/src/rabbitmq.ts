import amqp from "amqplib";

export async function publishInQueue(queue: string, message: any) {
  const connection = await amqp.connect("amqp://rabbitmq");
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  console.log(`Mensagem enviada para ${queue}`);
}

async function connectRabbitMQ() {
  while (true) {
    try {
      const connection = await amqp.connect("amqp://rabbitmq");
      console.log("Conectado ao RabbitMQ");
      return connection;
    } catch {
      console.log("RabbitMQ não disponível, tentando novamente...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

connectRabbitMQ();