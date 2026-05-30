import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import axios from "axios";

const app = express();
// alteração
const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
  return res.json({ status: "Pedidos funcionando" });
});

app.post("/pedido", async (req: Request, res: Response) => {
  const { produto, quantidade, valor } = req.body;

  if (!produto || !quantidade || !valor) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  let pagamentoResponse;
  try {
    pagamentoResponse = await axios.post(
      "http://pagamentos:3000/pagar",
      { valor, metodo: "pix" },
      { timeout: 5000 }
    );
    console.log("Pagamento:", pagamentoResponse.data);
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      console.log("Timeout no pagamento");
      return res.status(504).json({ error: "Timeout no serviço de pagamento" });
    }
    if (error.response?.data?.status === "recusado") {
      console.log("Pagamento recusado");
      return res.status(402).json({ error: "Pagamento recusado" });
    }
    console.log("Erro no pagamento:", error.message);
    return res.status(502).json({ error: "Erro no serviço de pagamento" });
  }

  try {
    const estoqueResponse = await axios.post(
      "http://estoque:3000/estoque",
      { produto, quantidade },
      { timeout: 5000 }
    );
    console.log("Estoque:", estoqueResponse.data);
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      console.log("Timeout no estoque");
      return res.status(504).json({ error: "Timeout no serviço de estoque" });
    }
    console.log("Erro no estoque:", error.message);
    return res.status(502).json({ error: "Erro no serviço de estoque" });
  }

  try {
    const pedido = await prisma.pedido.create({
      data: { produto, quantidade }
    });
    return res.status(201).json({
      message: "Pedido criado com sucesso",
      pedido
    });
  } catch (error: any) {
    console.log("Erro ao salvar pedido:", error.message);
    return res.status(500).json({ error: "Erro ao salvar pedido no banco" });
  }
});

app.get("/pedido", async (req: Request, res: Response) => {
  const pedidos = await prisma.pedido.findMany();
  return res.json(pedidos);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Pedidos rodando na porta ${PORT}`);
});