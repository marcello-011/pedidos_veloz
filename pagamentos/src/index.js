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
        status: "Pagamentos funcionando"
    });
});
app.post("/pagamento", (req, res) => {
    return res.json({
        message: "Pagamento processado"
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Pagamentos rodando na porta ${PORT}`);
});
//# sourceMappingURL=index.js.map