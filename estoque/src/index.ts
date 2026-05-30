import express from "express";
import amqp from "amqplib";

const app = express();
app.use(express.json());

async function consume(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqp.connect("amqp://rabbitmq");
      const channel = await connection.createChannel();
      await channel.assertQueue("estoque");

      channel.consume("estoque", (message) => {
        if (message) {
          const data = JSON.parse(message.content.toString());
          console.log(`Estoque reduzido via fila: ${data.produto} - ${data.quantidade}`);
          channel.ack(message);
        }
      });

      console.log("Conectado ao RabbitMQ");
      return;
    } catch {
      console.log(`RabbitMQ não disponível, tentando novamente... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error("Não foi possível conectar ao RabbitMQ. Encerrando.");
  process.exit(1);
}

consume();

app.post("/estoque", (req, res) => {
  const { produto, quantidade } = req.body;

  if (!produto || !quantidade) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  console.log(`Estoque reduzido via HTTP: ${produto} - ${quantidade}`);

  return res.json({
    status: "ok",
    message: "Estoque atualizado",
    produto,
    quantidade
  });
});

app.get("/health", (req, res) => {
  return res.json({ status: "Estoque funcionando" });
});

app.listen(3000, () => {
  console.log("Estoque rodando na porta 3000");
});