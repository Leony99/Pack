import { describe, expect, test } from "vitest";
import { gerarCsv, selectTableRows, type TableState } from "./table";
const state: TableState = { search: "", filters: {}, sort: null, direction: "asc" };
const rows = [
  { values: ["Camiseta 10", 100], filters: { status: "Ativo", type: "camisetas" } },
  { values: ["Bermuda", 9], filters: { status: "Oculto", type: "bermudas" } },
  { values: ["Camiseta 2", 20], filters: { status: "Ativo", type: "camisetas" } },
];
describe("filtros e ordenação das tabelas administrativas", () => {
  test("busca combina todos os filtros selecionados", () => {
    expect(
      selectTableRows(rows, {
        ...state,
        search: "CAMISETA",
        filters: { status: "Ativo", type: "camisetas" },
      }).map((r) => r.values[0]),
    ).toEqual(["Camiseta 10", "Camiseta 2"]);
    expect(
      selectTableRows(rows, { ...state, filters: { status: "Ativo", type: "bermudas" } }),
    ).toEqual([]);
  });
  test("preços ordenam numericamente nos dois sentidos sem alterar a origem", () => {
    expect(selectTableRows(rows, { ...state, sort: 1 }).map((r) => r.values[1])).toEqual([
      9, 20, 100,
    ]);
    expect(
      selectTableRows(rows, { ...state, sort: 1, direction: "desc" }).map((r) => r.values[1]),
    ).toEqual([100, 20, 9]);
    expect(rows.map((r) => r.values[1])).toEqual([100, 9, 20]);
  });
  test("nomes usam ordenação natural e busca ignora acentos", () => {
    expect(selectTableRows(rows, { ...state, sort: 0 }).map((r) => r.values[0])).toEqual([
      "Bermuda",
      "Camiseta 2",
      "Camiseta 10",
    ]);
    expect(
      selectTableRows([{ values: ["Operação"] }], { ...state, search: "operacao" }),
    ).toHaveLength(1);
  });
  test("valores ausentes ficam ao final nas duas direções", () => {
    for (const direction of ["asc", "desc"] as const)
      expect(
        selectTableRows([{ values: [null] }, { values: [10] }], {
          ...state,
          sort: 0,
          direction,
        }).at(-1)?.values,
      ).toEqual([null]);
  });
  test("coleções filtram produtos com múltiplas tags", () => {
    expect(
      selectTableRows([{ values: ["Tee"], filters: { collection: ["drop-02", "essentials"] } }], {
        ...state,
        filters: { collection: "essentials" },
      }),
    ).toHaveLength(1);
    expect(
      selectTableRows([{ values: ["Tee"], filters: { collection: ["drop-02"] } }], {
        ...state,
        filters: { collection: "essentials" },
      }),
    ).toHaveLength(0);
  });
});

describe("exportação CSV", () => {
  test("separa por ponto e vírgula e escapa aspas", () => {
    const csv = gerarCsv(["Nome", "Total"], [{ values: ['Camiseta "Pack"', 10] }]);
    expect(csv.split("\n")).toEqual(['"Nome";"Total"', '"Camiseta ""Pack""";"10"']);
  });

  test("célula que começa como fórmula ganha apóstrofo e não é executada no Excel", () => {
    const csv = gerarCsv(["Nome"], [{ values: ["=HYPERLINK(1)"] }, { values: ["-2"] }]);
    expect(csv.split("\n")).toEqual(['"Nome"', `"'=HYPERLINK(1)"`, `"'-2"`]);
  });
});
