export type LesaoClasse =
  | "CONTUSA"
  | "PERFUROCONTUSA"
  | "CORTANTE"
  | "PERFURANTE"
  | "MISTA"
  | "TERMICA"
  | "QUIMICA";

export interface LesaoSubclasse {
  codigo: string;
  nome: string;
  classe: LesaoClasse;
}

export class Lesoes {

  static classes: LesaoClasse[] = [
    "CONTUSA",
    "PERFUROCONTUSA",
    "CORTANTE",
    "PERFURANTE",
    "MISTA",
    "TERMICA",
    "QUIMICA"
  ];

  static tipos: LesaoSubclasse[] = [
    { codigo: "ESCORIACAO", nome: "Escoriação", classe: "CONTUSA" },
    { codigo: "EQUIMOSE", nome: "Equimose", classe: "CONTUSA" },
    { codigo: "HEMATOMA", nome: "Hematoma", classe: "CONTUSA" },

    { codigo: "FERIDA_CORTANTE", nome: "Ferida cortante", classe: "CORTANTE" },
    { codigo: "FERIDA_PERFURANTE", nome: "Ferida perfurante", classe: "PERFURANTE" },
    { codigo: "FERIDA_PERFUROCONTUSA", nome: "Ferida perfurocontusa", classe: "PERFUROCONTUSA" },

    { codigo: "LACERACAO", nome: "Laceração", classe: "MISTA" },

    { codigo: "QUEIMADURA_TERMICA", nome: "Queimadura térmica", classe: "TERMICA" },
    { codigo: "QUEIMADURA_QUIMICA", nome: "Queimadura química", classe: "QUIMICA" }
  ];

  static getTiposPorClasse(classe: LesaoClasse): LesaoSubclasse[] {
    return this.tipos.filter(t => t.classe === classe);
  }

  static getTipo(codigo: string): LesaoSubclasse | undefined {
    return this.tipos.find(t => t.codigo === codigo);
  }

  static isCodigoValido(codigo: string): boolean {
    return this.tipos.some(t => t.codigo === codigo);
  }
}

export interface Lesao {
  classe: LesaoClasse;
  subclasse: LesaoSubclasse;
  regiao: string;
  multiplicidade: string;
  funcao: string;
}