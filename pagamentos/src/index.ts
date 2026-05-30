import express from "express";

const app = express();

app.use(express.json());

app.post("/pagar", async (req, res) => {

    const { valor, metodo } = req.body;

    console.log("Recebido pagamento:", req.body);

    if (!valor || valor <= 0) {
        return res.status(400).json({
            error: "Valor inválido"
        });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const aprovado = Math.random() > 0.2;

    if (!aprovado) {

        console.log("Pagamento recusado");

        return res.status(400).json({
            status: "recusado",
            message: "Pagamento recusado"
        });

    }

    console.log("Pagamento aprovado");

    return res.json({
        status: "aprovado",
        metodo,
        valor,
        message: "Pagamento aprovado"
    });

});

app.get("/health", (req, res) => {
    return res.json({
        status: "Pagamentos funcionando"
    });
});

app.listen(3000, () => {
    console.log("Pagamentos rodando na porta 3000");
});