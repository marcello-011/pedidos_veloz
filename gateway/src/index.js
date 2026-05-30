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
        status: "Gateway funcionando"
    });
});
app.get("/gateway", (req, res) => {
    return res.json({
        message: "API Gateway ativo"
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gateway rodando na porta ${PORT}`);
});
//# sourceMappingURL=index.js.map