import { Cabelo } from './cabelo.model';
import {Atendimento } from './atendimento.model';
import { Base } from './base.model';
import { MapaTipoVestigio } from '../atendimento/vitima/mapa/mapa-ferramenta.enum';
import { MapaRegiao, parseMapaRegiao } from '../atendimento/vitima/mapa/mapa-regiao.enum';
import { MapaVisao, parseMapaVisao } from '../atendimento/vitima/mapa/mapa-visao.enum';

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

    tatuagens   = '';

    paf_frente = '';
    paf_costas = '';

    /** JSON: lista de `{ visao, id, x, y, tipo? }` (tipo: PAF|FACA|TACO|HEMATOMA) no mapa. */
    paf_mapa_marcacoes = '';

    observacoes = '';

    vestigios: VitimaVestigio[] = [];

    /*vestigios = new Map([
        ['cabeca_frente', new Vestigio()],
        ['cabeca_verso', new Visao()],
        ['cabeca_esquerda', new Visao()],
        ['cabeca_direita', new Visao()],
        ['corpo_frente', new Visao()],
        ['corpo_verso', new Visao()],
        ['corpo_esquerda', new Visao()],
        ['corpo_direita', new Visao()],
    ]);*/


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
        this.tatuagens              = this.getValue(data.tatuagens);

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
            tatuagens: this.tatuagens,
            paf_frente: this.paf_frente,
            paf_costas: this.paf_costas,
            paf_mapa_marcacoes: this.paf_mapa_marcacoes,
            vestigios: this.vestigios,
            observacoes: this.observacoes
          };

          return retorno;
    }


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
