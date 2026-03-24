export const Lateralidade = {
  DIREITA: "DIREITA",
  ESQUERDA: "ESQUERDA",
  MEDIANA: "MEDIANA",
  NAO_APLICAVEL: "NAO_APLICAVEL"
} as const;

export type Lateralidade =
  typeof Lateralidade[keyof typeof Lateralidade];