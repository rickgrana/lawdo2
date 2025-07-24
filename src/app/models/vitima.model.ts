import { Vestigio } from './vestigio.model';
import { Cabelo } from './cabelo.model';
import {Atendimento } from './atendimento.model';
import { Base } from './base.model';

export class Vitima extends Base {

    index: any; // apenas para exportacao

    identificada = 'Não reconhecida';
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

    observacoes = '';

    vestigios = [];

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

        this.observacoes              = this.getValue(data.observacoes);

        //console.log(data);

        if (data.vestigios) {

            /*['cabeca-verso', 'cabeca-frente', 'cabeca-direita', 'cabeca-esquerda',
            'corpo_verso', 'corpo-frente', 'corpo_direita', 'corpo_esquerda'].forEach((item) => {
                if (data.visoes.has(item)) {
                    let dataAux = this.visoes.get(item);

                    let visao = new Visao();
                    visao.load(dataAux);

                    this.visoes.set(item, visao);
                }
            });*/
            data.vestigios.forEach((item: any) => {
                const vestigio = new Vestigio();
                vestigio.load(item);
            });
        }

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
            observacoes: this.observacoes
          };

          return retorno;
    }


}
