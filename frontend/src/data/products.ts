/**
 * CATÁLOGO HARDCODED — fonte única de produtos enquanto não há backend.
 *
 * Para adicionar um produto: copie um objeto abaixo, troque o `id` e ajuste
 * os campos. As imagens vêm de `src/assets`.
 *
 * Quando o backend entrar: este arquivo deixa de ser usado e
 * `src/lib/api/catalogo.ts` passa a buscar de `GET /products`.
 */
import tee from "@/assets/product-tee.jpg";
import shorts from "@/assets/product-shorts.jpg";
import tank from "@/assets/product-tank.jpg";
import hoodie from "@/assets/product-hoodie.jpg";
import longsleeve from "@/assets/product-longsleeve.jpg";
import joggers from "@/assets/product-joggers.jpg";
import lifestyle from "@/assets/lifestyle.jpg";
import type { Product } from "./types";

const desc =
  "Peça construída em tecido pesado, corte oversized e acabamento minimalista. Design sem ruído para o treino e para o dia.";

export const products: Product[] = [
  {
    id: "p1",
    name: "Oversized Training Tee",
    price: 189,
    image: tee,
    images: [tee, lifestyle, tank],
    color: "BLACK",
    styles: ["treino", "casual"],
    type: "camisetas",
    section: "destaques",
    description: desc,
  },
  {
    id: "p2",
    name: "Stringer Tank",
    price: 139,
    image: tank,
    images: [tank, lifestyle, tee],
    color: "WHITE",
    styles: ["treino"],
    type: "camisetas",
    section: "novo-drop",
    description: desc,
  },
  {
    id: "p3",
    name: "Compression Long Sleeve",
    price: 199,
    image: longsleeve,
    images: [longsleeve, lifestyle, tee],
    color: "BLACK",
    styles: ["treino", "casual"],
    type: "camisetas",
    section: "destaques",
    description: desc,
  },
  {
    id: "p4",
    name: "Heavy Cotton Tee",
    price: 169,
    image: tee,
    images: [tee, lifestyle, longsleeve],
    color: "WHITE",
    styles: ["casual"],
    type: "camisetas",
    section: "novo-drop",
    description: desc,
  },
  {
    id: "p5",
    name: 'Performance Shorts 7"',
    price: 159,
    image: shorts,
    images: [shorts, lifestyle, joggers],
    color: "BLACK",
    styles: ["treino"],
    type: "bermudas",
    section: "novo-drop",
    description: desc,
  },
  {
    id: "p6",
    name: "Tapered Joggers",
    price: 249,
    image: joggers,
    images: [joggers, lifestyle, shorts],
    color: "BLACK",
    styles: ["casual", "treino"],
    type: "bermudas",
    section: "destaques",
    description: desc,
  },
  {
    id: "p7",
    name: "Sweat Shorts",
    price: 179,
    image: shorts,
    images: [shorts, lifestyle, joggers],
    color: "BLACK",
    styles: ["casual"],
    type: "bermudas",
    description: desc,
  },
  {
    id: "p8",
    name: "Heavyweight Hoodie Set",
    price: 549,
    image: hoodie,
    images: [hoodie, lifestyle, joggers],
    color: "BLACK",
    styles: ["casual"],
    type: "conjuntos",
    section: "destaques",
    description: desc,
  },
  {
    id: "p9",
    name: "Training Tracksuit",
    price: 489,
    image: joggers,
    images: [joggers, lifestyle, hoodie],
    color: "BLACK",
    styles: ["treino"],
    type: "conjuntos",
    section: "novo-drop",
    description: desc,
  },
  {
    id: "p10",
    name: "Off-Day Lounge Set",
    price: 429,
    image: longsleeve,
    images: [longsleeve, lifestyle, hoodie],
    color: "WHITE",
    styles: ["casual"],
    type: "conjuntos",
    description: desc,
  },
];
