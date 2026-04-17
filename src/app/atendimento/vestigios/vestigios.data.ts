import { VestigioCategoria } from './enums/vestigio-categoria.enum';

export { VestigioCategoria } from './enums/vestigio-categoria.enum';

export interface CategoriaVestigio {
  key: VestigioCategoria;
  nome: string;
}

export interface VestigioItem {
  categoria: VestigioCategoria;
  tipo: string;
  descricao: string;
  quantidade: number | null;
  localizacao: string;
  lacre: string;
}

export const CATEGORIAS_VESTIGIOS: CategoriaVestigio[] = [
  { key: VestigioCategoria.Biologicos, nome: '🔴 Vestígios Biológicos' },
  { key: VestigioCategoria.Balisticos, nome: '🔫 Vestígios Balísticos' },
  { key: VestigioCategoria.Papiloscopicos, nome: '🖐️ Vestígios Papiloscópicos' },
  { key: VestigioCategoria.ImpressoesMarcas, nome: '👣 Vestígios de Impressões e Marcas' },
  { key: VestigioCategoria.Fisicos, nome: '🧥 Vestígios Físicos' },
  { key: VestigioCategoria.Quimicos, nome: '🧪 Vestígios Químicos' },
  { key: VestigioCategoria.Microvestigios, nome: '🔬 Microvestígios' },
  { key: VestigioCategoria.ComportamentaisContextuais, nome: '🧠 Vestígios Comportamentais / Contextuais' },
];

export const TIPOS_POR_CATEGORIA: Record<VestigioCategoria, string[]> = {
  [VestigioCategoria.Biologicos]: [
    'Sangue',
    'Sêmen',
    'Saliva',
    'Suor',
    'Tecidos orgânicos',
    'Cabelos',
    'Pelos',
    'Material genético (DNA)',
  ],
  [VestigioCategoria.Balisticos]: [
    'Projéteis',
    'Fragmentos',
    'Cápsulas/estojos',
    'Marcas de disparo',
    'Trajetórias balísticas',
    'Resíduos de pólvora',
  ],
  [VestigioCategoria.Papiloscopicos]: [
    'Impressões digitais',
    'Palmares e plantares',
    'Marcas de contato em superfícies',
  ],
  [VestigioCategoria.ImpressoesMarcas]: [
    'Pegadas',
    'Marcas de pneus',
    'Marcas de ferramentas',
    'Marcas de arrasto',
  ],
  [VestigioCategoria.Fisicos]: [
    'Fibras de tecido',
    'Fragmentos de vidro',
    'Partículas de tinta',
    'Solo/poeira',
    'Resíduos diversos',
  ],
  [VestigioCategoria.Quimicos]: [
    'Resíduos de combustíveis e acelerantes (ex: gasolina, solventes)',
    'Resíduos de disparo de arma de fogo (GSR)',
    'Drogas e substâncias entorpecentes',
    'Medicamentos e substâncias tóxicas (venenos)',
    'Explosivos e seus resíduos',
    'Lubrificantes e óleos industriais',
    'Tintas, vernizes e solventes',
    'Adesivos e colas',
    'Resíduos de limpeza (água sanitária, detergentes, desinfetantes)',
    'Metais e íons metálicos (chumbo, bário, antimônio, etc.)',
    'Polímeros e plásticos (composição química)',
    'Resíduos de pólvora',
    'Substâncias corrosivas (ácidos e bases)',
    'Compostos orgânicos voláteis (VOCs)',
  ],
  [VestigioCategoria.Microvestigios]: [
    'Fibras têxteis',
    'Partículas de solo e minerais',
    'Fragmentos de vidro',
    'Partículas de tinta',
    'Resíduos de disparo de arma de fogo (GSR)',
    'Microvestígios biológicos',
    'Pólens e esporos',
    'Fragmentos metálicos',
    'Partículas de plástico e polímeros',
    'Resíduos químicos',
  ],
  [VestigioCategoria.ComportamentaisContextuais]: [
    'Posicionamento de objetos',
    'Cena simulada ou alterada',
    'Indícios de motivação (ex: crime passional, execução)',
  ],
};

export function getCategoriaByKey(categoriaKey: string): CategoriaVestigio | undefined {
  return CATEGORIAS_VESTIGIOS.find((c) => c.key === categoriaKey);
}

export function normalizeText(valor: string): string {
  return (valor || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveCategoriaKey(vestigio: any): VestigioCategoria {
  const categoria = normalizeText(vestigio?.categoria || vestigio?.tipoCategoria || vestigio?.grupo || '');
  const tipo = normalizeText(vestigio?.tipo || '');
  const referencia = `${categoria} ${tipo}`;

  if (referencia.includes('microvestigi')) return VestigioCategoria.Microvestigios;
  if (referencia.includes('biologic')) return VestigioCategoria.Biologicos;
  if (referencia.includes('balistic')) return VestigioCategoria.Balisticos;
  if (referencia.includes('papilosc')) return VestigioCategoria.Papiloscopicos;
  if (referencia.includes('impress') || referencia.includes('marca')) return VestigioCategoria.ImpressoesMarcas;
  if (referencia.includes('fisic')) return VestigioCategoria.Fisicos;
  if (referencia.includes('quimic')) return VestigioCategoria.Quimicos;
  if (referencia.includes('comport') || referencia.includes('context')) return VestigioCategoria.ComportamentaisContextuais;

  return VestigioCategoria.Fisicos;
}
