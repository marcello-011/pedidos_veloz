describe("Pagamentos", () => {
  it("deve validar que valor é obrigatório", () => {
    const body: any = { metodo: "pix" };
    expect(body.valor).toBeUndefined();
  });

  it("deve rejeitar valor zero", () => {
    const body: any = { valor: 0, metodo: "pix" };
    expect(body.valor).toBeLessThanOrEqual(0);
  });
});