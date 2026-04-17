export interface CategoriaVestigio {
  key: string;
  nome: string;
}

export interface VestigioItem {
  categoria: string;
  tipo: string;
  descricao: string;
  quantidade: number | null;
  localizacao: string;
  lacre: string;
}

export const CATEGORIAS_VESTIGIOS: CategoriaVestigio[] = [
  { key: 'biologicos', nome: '🔴 Vestígios Biológicos' },
  { key: 'balisticos', nome: '🔫 Vestígios Balísticos' },
  { key: 'papiloscopicos', nome: '🖐️ Vestígios Papiloscópicos' },
  { key: 'impressoes-marcas', nome: '👣 Vestígios de Impressões e Marcas' },
  { key: 'fisicos', nome: '🧥 Vestígios Físicos' },
  { key: 'comportamentais-contextuais', nome: '🧠 Vestígios Comportamentais / Contextuais' },
];

export const TIPOS_POR_CATEGORIA: Record<string, string[]> = {
  biologicos: [
    'Sangue',
    'Sêmen',
    'Saliva',
    'Suor',
    'Tecidos orgânicos',
    'Cabelos',
    'Pelos',
    'Material genético (DNA)',
  ],
  balisticos: [
    'Projéteis',
    'Fragmentos',
    'Cápsulas/estojos',
    'Marcas de disparo',
    'Trajetórias balísticas',
    'Resíduos de pólvora',
  ],
  papiloscopicos: [
    'Impressões digitais',
    'Palmares e plantares',
    'Marcas de contato em superfícies',
  ],
  'impressoes-marcas': [
    'Pegadas',
    'Marcas de pneus',
    'Marcas de ferramentas',
    'Marcas de arrasto',
  ],
  fisicos: [
    'Fibras de tecido',
    'Fragmentos de vidro',
    'Partículas de tinta',
    'Solo/poeira',
    'Resíduos diversos',
  ],
  'comportamentais-contextuais': [
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

export function resolveCategoriaKey(vestigio: any): string {
  const categoria = normalizeText(vestigio?.categoria || vestigio?.tipoCategoria || vestigio?.grupo || '');
  const tipo = normalizeText(vestigio?.tipo || '');
  const referencia = `${categoria} ${tipo}`;

  if (referencia.includes('biologic')) return 'biologicos';
  if (referencia.includes('balistic')) return 'balisticos';
  if (referencia.includes('papilosc')) return 'papiloscopicos';
  if (referencia.includes('impress') || referencia.includes('marca')) return 'impressoes-marcas';
  if (referencia.includes('fisic')) return 'fisicos';
  if (referencia.includes('comport') || referencia.includes('context')) return 'comportamentais-contextuais';

  return 'fisicos';
}
