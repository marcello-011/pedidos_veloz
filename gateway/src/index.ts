import express, { Request, Response } from "express";
import axios from "axios";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    return res.json({
        gateway: "API Gateway ativo"
    });
});

app.get("/pedidos", async (req: Request, res: Response) => {

    try {

        const response = await axios.get("http://pedidos:3000/pedido");

        return res.json(response.data);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao acessar serviço de pedidos"
        });

    }

});

app.post("/pedidos", async (req: Request, res: Response) => {

    try {

        const response = await axios.post(
            "http://pedidos:3000/pedido",
            req.body
        );

        return res.status(201).json(response.data);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Erro ao criar pedido"
        });

    }

});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Gateway rodando na porta ${PORT}`);
});