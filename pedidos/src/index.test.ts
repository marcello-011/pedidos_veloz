describe("Pedidos", () => {
  it("deve validar que produto é obrigatório", () => {
    const body: any = { quantidade: 2, valor: 100 };
    expect(body.produto).toBeUndefined();
  });

  it("deve validar que quantidade é obrigatória", () => {
    const body: any = { produto: "Teclado", valor: 100 };
    expect(body.quantidade).toBeUndefined();
  });

  it("deve validar que valor é obrigatório", () => {
    const body: any = { produto: "Teclado", quantidade: 2 };
    expect(body.valor).toBeUndefined();
  });
});