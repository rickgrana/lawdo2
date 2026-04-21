import { Cabelo } from './cabelo.model';
import {Atendimento } from './atendimento.model';
import { Base } from './base.model';
import { NumberHelper } from '../extensions/numberHelper';
import { MapaTipoVestigio } from '../atendimento/vitima/mapa/mapa-ferramenta.enum';
import { MapaRegiao, parseMapaRegiao } from '../atendimento/vitima/mapa/mapa-regiao.enum';
import { MapaVisao, parseMapaVisao } from '../atendimento/vitima/mapa/mapa-visao.enum';

/** Pertence cadastrado na vítima (quantidade + descrição livre). */
export interface PertenceVitima {
    quantidade: number;
    descricao: string;
}

export interface TatuagemVitima {
    regiao: string;
    descricao: string;
}

export interface VitimaVestigioCoordenada {
    x: number;
    y: number;
}

export interface VitimaVestigio {
    visao: MapaVisao;
    regiao: MapaRegiao;
    tipoVestigio: MapaTipoVestigio;
    quantidade: number;
    coordenadas: VitimaVestigioCoordenada[];
}

export class Vitima extends Base {

    index: any; // apenas para exportacao

    identificada: string|boolean = 'Não reconhecida';
    nome  = '';
    sexo     = 'M';
    idade    = 0;
    complfisica  = '';
    etnia    = '';

    condicoes = '';

    cabelo = new Cabelo();

    posicao       =   '';
    estado       =   '';
    estatura     =   '';
    porte        = '';
    rg           = '';
    localizacao  = '';

    vestes = {
        cabeca: '',
        superior:     '',
        inferior:     '',
        calcados:     ''
    };

    pertences   = '';
    pertencesLista: PertenceVitima[] = [];

    tatuagens   = '';
    tatuagensLista: TatuagemVitima[] = [];

    paf_frente = '';
    paf_costas = '';

    /** JSON: lista de `{ visao, id, x, y, tipo? }` (tipo: PAF|FACA|TACO|HEMATOMA) no mapa. */
    paf_mapa_marcacoes = '';

    observacoes = '';

    vestigios: VitimaVestigio[] = [];

    static override loadFrom(record: any){
        const model = new Vitima();
        model.isNew = false;
        model.load(record);
        return model;
    }


    override load(data: any) {

        this.isNew = false;

        this.condicoes              = this.getValue(data.condicoes);

        if(data.identificada === false){
            this.identificada = 'Não reconhecida';
        }else{
            if(data.identificada === true){
                this.identificada = 'Reconhecida';
            }else{
                this.identificada           = this.getValue(data.identificada);
            }
        }

        this.nome                   = this.getValue(data.nome);
        this.sexo                   = this.getValue(data.sexo);
        this.idade                  = this.getValue(data.idade);
        this.complfisica            = this.getValue(data.complfisica);
        this.etnia                  = this.getValue(data.etnia);
        this.cabelo.tipo            = this.getValue(data.cabelo.tipo);
        this.cabelo.cor             = this.getValue(data.cabelo.cor);
        this.cabelo.comprimento     = this.getValue(data.cabelo.comprimento);
        this.posicao                = this.getValue(data.posicao);
        this.estado                 = this.getValue(data.estado);
        this.estatura               = this.getValue(data.estatura);
        this.porte                  = this.getValue(data.porte);
        this.rg                     = this.getValue(data.rg);
        this.localizacao            = this.getValue(data.localizacao);

        this.vestes.cabeca          = this.getValue(data.vestes.cabeca);
        this.vestes.superior        = this.getValue(data.vestes.superior);
        this.vestes.inferior        = this.getValue(data.vestes.inferior);
        this.vestes.calcados         = this.getValue(data.vestes.calcados);

        this.pertences              = this.getValue(data.pertences);
        this.pertencesLista         = normalizarPertencesLista(data.pertencesLista, this.pertences);
        this.pertences              = serializarPertencesParaCampoTexto(this.pertencesLista);
        this.tatuagens              = this.getValue(data.tatuagens);
        this.tatuagensLista         = normalizarTatuagensLista(data.tatuagensLista, this.tatuagens);
        this.tatuagens              = serializarTatuagensParaCampoTexto(this.tatuagensLista);

        this.paf_frente              = this.getValue(data.paf_frente);
        this.paf_costas              = this.getValue(data.paf_costas);
        this.paf_mapa_marcacoes      = this.getValue(data.paf_mapa_marcacoes);

        this.observacoes              = this.getValue(data.observacoes);

        //console.log(data);

        this.vestigios              = normalizarVestigios(data.vestigios);

    }

    isIdentificada(){
        return this.identificada != 'Não reconhecida';
    }

    getArtigo() {
      if (this.sexo === 'M') {
          return 'o';
      }

      if (this.sexo === 'F') {
          return 'a';
      }

      return '';
    }

    getSexoText() {
      if (this.sexo === 'M') {
          return 'Masculino';
      }

      if (this.sexo === 'F') {
          return 'Feminino';
      }

      if (this.sexo === 'X') {
          return 'Indefinido';
      }

      return '';
    }

    get tipos_identificacao(){
        return Array(
            'Não Reconhecida',
            'Reconhecida',
            'Identificada'
        );
    }


    get etnias(){
        return Array(
            'Morena',
            'Parda',
            'Negra',
            'Branca',
            'Amarela'
        );
    }

    get portes() {
        return Array(
            'Adulto',
            'Jovem',
            'Criança'
        );
    }

    get compleicoes() {
        return Array(
            'Franzina',
            'Normolínea',
            'Robusta'
        );
    }

    get estaturas() {
        return Array(
            'Baixa',
            'Mediana',
            'Alta'
        );
    }

    get posicoes() {
        return Array(
            'Dorsal',
            'Ventral',
            'Sentado',
            'Cócoras',
            'Fetal',
            'Lateral Esquerda',
            'Lateral Direita',
            'Em Suspensão Incompleta',
            'Em Suspensão Completa'
        );
    }

    get estados() {
        return Array(
            'Flacidez',
            'Rigidez Iniciada',
            'Rigidez Total',
            'Hipóstase',
            'Putrefação'
        );
    }

    getNome() {
        if(this.identificada !== 'Não reconhecido') {
            return this.nome;
        }

        return 'Não Reconhecido';
    }

    override rawData() {
        let retorno = {
            identificada: this.identificada,
            nome: this.nome,
            sexo: this.sexo,
            rg: this.rg,
            idade: this.idade,
            condicoes: this.condicoes,
            porte: this.porte,
            complfisica: this.complfisica,
            estatura: this.estatura ,
            etnia: this.etnia,
            posicao : this.posicao,
            estado: this.estado,
            localizacao: this.localizacao,
            cabelo: {
              tipo: this.cabelo.tipo,
              cor: this.cabelo.cor ,
              comprimento: this.cabelo.comprimento
            },
            vestes: {
              cabeca: this.vestes.cabeca,
              calcados: this.vestes.calcados,
              superior: this.vestes.superior,
              inferior: this.vestes.inferior,
            },
            pertences: this.pertences,
            pertencesLista: this.pertencesLista,
            tatuagens: this.tatuagens,
            tatuagensLista: this.tatuagensLista,
            paf_frente: this.paf_frente,
            paf_costas: this.paf_costas,
            paf_mapa_marcacoes: this.paf_mapa_marcacoes,
            vestigios: this.vestigios,
            observacoes: this.observacoes
          };

          return retorno;
    }


}

/** Lista normalizada para laudo/exportação (legado + campo atual). */
export function obterPertencesItensParaDocumento(vitima: Vitima): PertenceVitima[] {
    return normalizarPertencesLista(vitima.pertencesLista, vitima.pertences);
}

/** Linha para laudo: `01 (uma) BOLSA …` com numeral por extenso e gênero inferido pela descrição. */
export function formatarPertenceParaLaudo(item: PertenceVitima): string {
    let q = Math.floor(Number(item.quantidade));
    if (!Number.isFinite(q) || q < 1) {
        q = 1;
    }

    const descricao = String(item.descricao ?? '').trim();
    const gen = inferirGeneroDescricaoPertence(descricao);

    let numeral: string;
    let extenso: string;

    if (q <= 99) {
        numeral = q.toString().padStart(2, '0');
        extenso = NumberHelper.getExtenso(q, gen);
    } else {
        numeral = String(q);
        extenso = String(q);
    }

    return `${numeral} (${extenso}) ${descricao.toUpperCase()}`;
}

export function obterTatuagensItensParaDocumento(vitima: Vitima): TatuagemVitima[] {
    return normalizarTatuagensLista(vitima.tatuagensLista, vitima.tatuagens);
}

function inferirGeneroDescricaoPertence(descricao: string): 'M' | 'F' {
    const primeira = primeiroTokenPalavra(descricao);
    const p = primeira.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    if (!p.length) {
        return 'M';
    }

    const femininosPorSufixo = ['ção', 'são', 'gem', 'agem', 'ência', 'ância', 'itude', 'oria', 'ismo'];
    if (femininosPorSufixo.some((s) => p.endsWith(s))) {
        return 'F';
    }

    const mascTerminadosEmA = ['dia', 'mapa', 'radio', 'problema', 'clima', 'sistema', 'plasma', 'tema', 'programa'];
    if (mascTerminadosEmA.includes(p)) {
        return 'M';
    }

    if (p.endsWith('a')) {
        return 'F';
    }
    if (p.endsWith('o')) {
        return 'M';
    }

    return 'M';
}

function primeiroTokenPalavra(descricao: string): string {
    const tokens = descricao.trim().split(/\s+/).filter((t) => t.length > 0);
    for (const bruto of tokens) {
        const t = bruto.replace(/^[^a-zA-ZÀ-ÿ0-9]+/i, '').replace(/[^a-zA-ZÀ-ÿ0-9]+$/i, '');
        if (!t.length || /^\d+$/.test(t)) {
            continue;
        }
        return t;
    }
    return '';
}

function normalizarPertencesLista(rawLista: unknown, rawTexto: unknown): PertenceVitima[] {
    if (Array.isArray(rawLista) && rawLista.length > 0) {
        const out: PertenceVitima[] = [];
        for (const el of rawLista) {
            if (typeof el === 'string') {
                const item = pertenceParseLegadoTexto(el.trim());
                if (item.descricao.length > 0) {
                    out.push(item);
                }
                continue;
            }
            if (el && typeof el === 'object') {
                const o = el as Record<string, unknown>;
                const qRaw = Number(o['quantidade'] ?? o['qtd'] ?? 1);
                const q = Number.isFinite(qRaw) && qRaw > 0 ? Math.floor(qRaw) : 1;
                const d = String(o['descricao'] ?? '').trim();
                if (d.length > 0) {
                    out.push({ quantidade: q, descricao: d });
                }
            }
        }
        if (out.length > 0) {
            return out;
        }
    }

    return String(rawTexto ?? '')
        .split(',')
        .map((parte) => parte.trim())
        .filter((parte) => parte.length > 0)
        .map((parte) => pertenceParseLegadoTexto(parte));
}

function pertenceParseLegadoTexto(texto: string): PertenceVitima {
    const m = texto.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    if (m) {
        const q = parseInt(m[1], 10);
        const descricao = String(m[2] ?? '').trim();
        return {
            quantidade: Number.isFinite(q) && q > 0 ? q : 1,
            descricao,
        };
    }
    return { quantidade: 1, descricao: texto.trim() };
}

/** Campo texto legado (lista separada por vírgulas; quantidade > 1 como `Nx descrição`). */
export function serializarPertencesParaCampoTexto(items: PertenceVitima[]): string {
    return items
        .filter((i) => String(i.descricao ?? '').trim().length > 0)
        .map((i) => {
            const q = Math.floor(Number(i.quantidade));
            const qOk = Number.isFinite(q) && q > 0 ? q : 1;
            const d = String(i.descricao ?? '').trim();
            return qOk > 1 ? `${qOk}x ${d}` : d;
        })
        .join(', ');
}

export function serializarTatuagensParaCampoTexto(items: TatuagemVitima[]): string {
    return items
        .map((i) => ({ regiao: String(i.regiao ?? '').trim(), descricao: String(i.descricao ?? '').trim() }))
        .filter((i) => i.regiao.length > 0 || i.descricao.length > 0)
        .map((i) => {
            if (i.regiao.length > 0 && i.descricao.length > 0) {
                return i.regiao + ': ' + i.descricao;
            }
            return i.regiao.length > 0 ? i.regiao : i.descricao;
        })
        .join(', ');
}

function normalizarTatuagensLista(rawLista: unknown, rawTexto: unknown): TatuagemVitima[] {
    if (Array.isArray(rawLista) && rawLista.length > 0) {
        const out: TatuagemVitima[] = [];
        for (const el of rawLista) {
            if (typeof el === 'string') {
                const item = parseTatuagemLegadaTexto(el);
                if (item.regiao.length > 0 || item.descricao.length > 0) {
                    out.push(item);
                }
                continue;
            }
            if (el && typeof el === 'object') {
                const o = el as Record<string, unknown>;
                const regiao = String(o['regiao'] ?? '').trim();
                const descricao = String(o['descricao'] ?? '').trim();
                if (regiao.length > 0 || descricao.length > 0) {
                    out.push({ regiao, descricao });
                }
            }
        }
        if (out.length > 0) {
            return out;
        }
    }

    return String(rawTexto ?? '')
        .split(',')
        .map((item) => parseTatuagemLegadaTexto(item))
        .filter((item) => item.regiao.length > 0 || item.descricao.length > 0);
}

function parseTatuagemLegadaTexto(raw: string): TatuagemVitima {
    const texto = String(raw ?? '').trim();
    if (!texto.length) {
        return { regiao: '', descricao: '' };
    }

    const idxDoisPontos = texto.indexOf(':');
    if (idxDoisPontos > -1) {
        return {
            regiao: texto.slice(0, idxDoisPontos).trim(),
            descricao: texto.slice(idxDoisPontos + 1).trim(),
        };
    }

    return { regiao: texto, descricao: '' };
}

function normalizarVestigios(raw: unknown): VitimaVestigio[] {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out: VitimaVestigio[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        const o = item as Record<string, unknown>;
        const visao = parseMapaVisao(String(o['visao'] ?? ''));
        const regiao = parseMapaRegiao(String(o['regiao'] ?? '').trim());
        const tipoVestigioRaw = String(o['tipoVestigio'] ?? '').trim().toUpperCase();
        const tipoVestigio = (Object.values(MapaTipoVestigio) as string[]).includes(tipoVestigioRaw)
            ? (tipoVestigioRaw as MapaTipoVestigio)
            : null;
        const coordenadasRaw = Array.isArray(o['coordenadas']) ? o['coordenadas'] : [];
        const coordenadas: VitimaVestigioCoordenada[] = [];
        for (const c of coordenadasRaw) {
            if (!c || typeof c !== 'object') {
                continue;
            }
            const cc = c as Record<string, unknown>;
            const x = Number(cc['x']);
            const y = Number(cc['y']);
            if (Number.isFinite(x) && Number.isFinite(y)) {
                coordenadas.push({ x, y });
            }
        }
        if (!visao || !regiao || !tipoVestigio || coordenadas.length === 0) {
            continue;
        }
        const quantidadeRaw = Number(o['quantidade']);
        const quantidade = Number.isFinite(quantidadeRaw) ? quantidadeRaw : coordenadas.length;
        out.push({ visao, regiao, tipoVestigio, quantidade, coordenadas });
    }
    return out;
}
