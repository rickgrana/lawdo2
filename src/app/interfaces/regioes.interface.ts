import { Lateralidade } from "../const/lateralidades.const";

export interface RegiaoAnatomica {
  codigo: number;
  nome: string;
  lateralidades: Lateralidade[];
}