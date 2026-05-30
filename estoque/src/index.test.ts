describe("Estoque", () => {
  it("deve validar que produto é obrigatório", () => {
    const body: any = { quantidade: 5 };
    expect(body.produto).toBeUndefined();
  });

  it("deve validar que quantidade é obrigatória", () => {
    const body: any = { produto: "Monitor" };
    expect(body.quantidade).toBeUndefined();
  });
});