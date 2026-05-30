"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    return res.json({
        status: "Pedidos funcionando"
    });
});
app.post("/pedido", (req, res) => {
    return res.json({
        message: "Pedido criado com sucesso"
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Pedidos rodando na porta ${PORT}`);
});
//# sourceMappingURL=index.js.map