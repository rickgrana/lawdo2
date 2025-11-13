import { map } from 'rxjs/operators';
import { Vitima } from './vitima.model';
import { Quesito } from './quesito.model';
import { Veiculo } from './veiculo.model';
import { Vestigio } from './vestigio.model';
import { Timestamp } from 'firebase/firestore';

//@TODO: Natureza do Delito (ROUBO, FURTO, DANO

//@TODO: OBJETO DE EXAME

// @TODO: Autoridade nao presente

// @TODO quem acompanhou os exames

//

export interface Imagem{
    nome: string;
    imagem: string;
    legenda: string;
    colunas?: number;
}

export class Atendimento {

    static SIT_ABERTO      = 0;
    static SIT_ANDAMENTO   = 1;
    static SIT_CONCLUIDO   = 2;
    static SIT_ARQUIVADO   = 9;

    isNew = false;

    id: any;

    fields = {
        perito: {},

        situacao: Atendimento.SIT_ABERTO,

        data:  Timestamp.fromDate(new Date()),
        hora: '',

        natureza: '',

        tipoExame: '',

        conclusao: '',
        dinamica: '',

        protocolo:  {
            numero: '',
            ano: ''
        },


        coordenadas: {
            lat: 0,
            long: 0
        },

        endereco: {
            cidade: '',
            bairro: '',
            logradouro: '',
            pontoref: ''
        },

        laudo: {
            numero: '',
            ano: '',
            data: ''
        },

        possuiRequisicao: false,

        requisicao: {
            recebida: false,
            origem: '',
            destino: '',
            delegado: '',
            recebimento: '',
            ip: '',
        },

        local: {
            natureza: '',
            zona: '',
            funcao: '',
            tipo: '',
            construcao: '',
            isolamento: '',
            preservacao:   '',
            condicoes:   '',
            descricao: '',
            acesso: ''
        },

        equipes: {
            pc: {
                presente: true,
                delegado : '',
                investigacao: '',
                vtr: '',
                origem: ''
            },

            pm: {
                presente: true,
                representante : '',
                origem: '',
                vtr: ''
            }
        },

        armas: {
            encontradas: false,
            items: []
        },

        dtcriacao: {},
        dtupdate: {},
        vitimas: [] as Vitima[],
        veiculos: [] as Veiculo[],
        vestigios: [] as Vestigio[]


    };

    quesitos: any[] = [];

    imagens: Imagem[] = [];

    getNumeroProtocolo(){
        let retorno = this.fields.protocolo.ano.substr(2,2) + '-' + this.fields.protocolo.numero; 

        return retorno;
    }

    getNumeroLaudo(){
        return this.fields.laudo.numero + '/'+ this.fields.laudo.ano.substr(2,2);
    }


    get naturezas() {
        return new Array(
            'CRIME CONTRA A VIDA',
            'CRIME CONTRA O PATRIMÔNIO',
            'CRIME DE TRÂNSITO',
        );
    }


    get tipos_exame() {
        return new Array(
            'LOCAL DE ENCONTRO DE CADÁVER',
            'LOCAL DE SUICÍDIO',
            'LOCAL DE CRIME CONTRA A VIDA',
            'LOCAL DE FURTO',
            'LOCAL DE ROUBO',
            'LOCAL DE DISPARO DE ARMA DE FOGO',
            'LOCAL DE RESISTÊNCIA POLICIAL',
            'CRIME CONTRA PATRIMÔNIO',
            'PERÍCIA DE TRÂNSITO',
            'VISTORIA EM VEÍCULO',
            'VISTORIA EM IMÓVEL',
            'VISTORIA EM LOCAL DE CRIME',
        );
    }

    get isCrimeVida(){
        return (this.fields.tipoExame == 'LOCAL DE ENCONTRO DE CADÁVER') ||
            (this.fields.tipoExame == 'LOCAL DE SUICÍDIO') ||
            (this.fields.tipoExame == 'LOCAL DE CRIME CONTRA A VIDA');
    }

    get isSuicidio(){
        return (this.fields.tipoExame == 'LOCAL DE SUICÍDIO');
    }

    get tipos_exame_imagens() {
        return new Map([
            ['LOCAL DE ENCONTRO DE CADÁVER', ['skull-outline', 'danger']],
            ['LOCAL DE SUICÍDIO', ['sad', 'dark']],
            ['LOCAL DE CRIME CONTRA A VIDA',['skull-outline', 'danger']],
            ['LOCAL DE FURTO',['unlock', 'primary']],
            ['LOCAL DE ROUBO',['unlock', 'primary']],
            ['LOCAL DE DISPARO DE ARMA DE FOGO',['locate', 'danger']],
            ['LOCAL DE RESISTÊNCIA POLICIAL',['walk', 'danger']],
            ['CRIME CONTRA PATRIMÔNIO',['home', 'danger']],
            ['PERÏCIA DE TRÂNSITO',['car', 'primary']],
            ['VISTORIA EM VEÍCULO',['car', 'secondary']],
            ['VISTORIA EM IMÓVEL',['home', 'tertiary']],
            ['VISTORIA EM LOCAL DE CRIME',['home', 'tertiary']],
        ]);
    }

    iconTipoExame(){
        let imagens = this.tipos_exame_imagens;

        let retorno =  imagens.get(this.fields.tipoExame);

        return retorno ? retorno[0] : null;
    }

    iconColorTipoExame(){
        let imagens = this.tipos_exame_imagens;

        let retorno =  imagens.get(this.fields.tipoExame);

        return retorno ? retorno[1]: null;
    }


    get zonas_local() {
        return new Array(
            'Urbana',
            'Rural'
        );
    }

    get naturezas_local() {
        return new  Array(
        'Via Pública',
        'Imóvel',
        'Terreno',
        'Calçada',
        'Área de Mata',
        'Outro'
        );
    }


    get funcoes_imovel() {
        return new Array(
            'Residencial',
            'Comercial',
            'Industrial',
            'Público',
        );
    }

    get funcoes_terreno() {
        return new Array(
            'Baldio',
            'Quintal',
            'Sítio'
        );
    }

    get tipos_residencia() {
        return new Array(
            'Casa',
            'Apartamento',
            'Kitnet',
            'Flat',
            'Sobrado',
        );
    }

    get tipos_comercial() {
        return new Array(
            'Loja',
            'Sala',
            'Depósito',
            'Galpão'
        );
    }

    get construcoes_via() {
        return new Array(
            'Pavimentada',
            'Não Pavimentada',
        );
    }

    get construcoes_imovel() {
        return new Array(
            'Alvenaria',
            'Madeira',
            'Concreto',
            'Container',
            'Estrutura Metálica'
        );
    }

    get isolamentos() {
        return new  Array(
            'Não isolado',
            'Parcialmente Isolado',
            'Isolado'
        );
    }

    get preservacoes() {
        return new Array(
            'Não preservado',
            'Prejudicada',
            'Parcialmente preservado',
            'Preservado'
        );
    }


    situacoes = new Map([
        [Atendimento.SIT_ABERTO, 'Aberto'],
        [Atendimento.SIT_ANDAMENTO, 'Em Andamento'],
        [Atendimento.SIT_CONCLUIDO, 'Concluido'],
        [Atendimento.SIT_ARQUIVADO, 'Arquivado'],
    ]);

    constructor() {
        this.isNew = true;

        /*const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        this.cidade = 'MANAUS'; */
        this.fields.endereco.cidade = 'MANAUS';
    }

    getSituacao() {
        const opcoes = this.situacoes;

        return opcoes.get(this.fields.situacao);
    }

    static loadFromDoc(doc: any) {
        let model = new Atendimento();
        model.isNew = false;
        model.id = doc.id;
        model.load(doc.data);

        return model;
    }

    getValue(texto: any) {
        if (texto === undefined) {
            return '';
        } else {
            return texto;
        }
    }

    load(data: any) {

        this.fields.data           = data.data;
        this.fields.hora        = this.getValue(data.hora);

        this.fields.tipoExame        = this.getValue(data.tipoExame);

        if(data.situacao){
            this.fields.situacao        = this.getValue(data.situacao);
        }

        if(data.protocolo){
            this.fields.protocolo   = this.getValue(data.protocolo);
        }

        this.fields.perito      = this.getValue(data.perito);

        if(data.endereco){
            this.fields.endereco    = this.getValue(data.endereco);
        }

        if(data.laudo){
            this.fields.laudo       = this.getValue(data.laudo);
        }

        if(data.possuiRequisicao){
            this.fields.possuiRequisicao = data.possuiRequisicao;
        }

        if(data.requisicao){
            this.fields.requisicao  = this.getValue(data.requisicao);
        }

        if(data.local){
            this.fields.local       = this.getValue(data.local);
        }


        if(data.coordenadas){
            this.fields.coordenadas     = this.getValue(data.coordenadas);
        }

        if(data.equipes){
            this.fields.equipes     = this.getValue(data.equipes);
        }

        if(data.conclusao){
            this.fields.conclusao     = this.getValue(data.conclusao);
        }

        if(data.dinamica){
            this.fields.dinamica     = this.getValue(data.dinamica);
        }

        this.fields.dtcriacao   = this.getValue(data.dtcriacao);
        this.fields.dtupdate    = this.getValue(data.dtupdate);

        this.fields.vitimas = [];

        if(data.vitimas) {
            data.vitimas.forEach((vitima: Vitima) => {
                this.fields.vitimas.push(Vitima.loadFrom(vitima));
            });
        }

        if(data.veiculos) {
            data.veiculos.forEach((veiculo: Veiculo) => {
                this.fields.veiculos.push(Veiculo.loadFrom(veiculo));
            });
        }

        this.quesitos = [];
        if(data.quesitos) {
            data.quesitos.forEach((item: Quesito) => {
                const quesito = Quesito.loadFrom(item);
                this.quesitos.push(quesito);
            });
        }

        if(data.vestigios) {
            data.vestigios.forEach((vestigio: Vestigio) => {
                //this.fields.vestigios.push(Vitima.loadFrom(vitima));
            });
        }

        this.imagens = [];

        if(data.imagens) {
            this.imagens = data.imagens;
        }
    }

    isPossuiConstrucao() {
        return ((this.fields.local.natureza === 'Via Pública') || (this.fields.local.natureza === 'Imóvel'));
    }

    isPossuiFuncao() {
        return ((this.fields.local.natureza === 'Terreno') || (this.fields.local.natureza === 'Imóvel'));
    }

    isPossuiTipo() {
        return (this.fields.local.natureza === 'Imóvel') && (
            (this.fields.local.funcao === 'Residencial') || (this.fields.local.funcao === 'Comercial')
        );
    }

    getConstrucaoText() {
        if ((this.isPossuiConstrucao())) {
            if (this.fields.local.natureza === 'Via Pública') {
                return this.fields.local.construcao;
            } else {
                return ' construído em ' + this.fields.local.construcao;
            }
        } else {
            return '';
        }
    }


    getFuncaoText() {
        if ((this.isPossuiFuncao())) {
            return this.fields.local.funcao;
        }
        return '';
    }

    getTipoText() {
        if ((this.isPossuiTipo())) {
            return this.fields.local.tipo;
        }
        return '';
    }


    getIsolamentoText() {
        if (this.fields.local.isolamento === 'Não isolado') {
            return 'não estava isolado';
        }

        return 'estava ' + this.fields.local.isolamento;
    }

    getPreservacaoText() {
        if (this.fields.local.preservacao === 'Não preservado') {
            return 'não estava preservado';
        }

        if (this.fields.local.preservacao === 'Prejudicada') {
            return 'estava com sua preservação prejudicada';
        }

        return 'estava ' + this.fields.local.preservacao;
    }


    getNaturezaImage(){

        console.log(this.fields.natureza);

        switch(this.fields.natureza){
            case 'PATRIMÔNIO':  return 'patrimonio'; break;
            case 'TRÂNSITO':  return 'transito'; break;
            case 'VIDA': return 'vida'; break;
        }

        return null;
    }

    rawData() {

        const vitimas: any[] = [];
        this.fields.vitimas.forEach((vitima: Vitima) => {
            vitimas.push(vitima.rawData());
        });


        const veiculos: any[] = [];
        this.fields.veiculos.forEach((veiculo: Veiculo) => {
            veiculos.push(veiculo.rawData());
        });

        const quesitos: any[] = [];
        this.quesitos.forEach((quesito: Quesito) => {
            quesitos.push(quesito.rawData());
        });

        const imagens: any[] = [];
        this.imagens.forEach((imagem) => {
            /*if(!imagem.colunas){
                imagem.colunas = 1;
            }*/
            imagens.push({ nome: imagem.nome, legenda: imagem.legenda, colunas: imagem.colunas});
        });

        return {
            data: this.fields.data ,
            hora: this.fields.hora ,
            tipoExame: this.fields.tipoExame,
            protocolo: this.fields.protocolo ,
            perito: this.fields.perito,
            situacao: this.fields.situacao,
            endereco: this.fields.endereco,
            coordenadas: this.fields.coordenadas,
            laudo : this.fields.laudo,
            requisicao: this.fields.requisicao ,
            local: this.fields.local,
            equipes: this.fields.equipes,
            conclusao: this.fields.conclusao,
            dinamica: this.fields.dinamica,
            dtcriacao: this.fields.dtcriacao,
            dtupdate: this.fields.dtupdate,
            vitimas: vitimas,
            quesitos: quesitos,
            veiculos: veiculos,
            imagens: imagens
        };

        //this.fields.quesitos = [];

        /*if(data.quesitos) {
            this.fields.quesitos = data.quesitos;
        }*/
    }

    getEndereco() {

        let retorno = '';

        if(this.fields.endereco && this.fields.endereco.cidade) {

            if(this.fields.endereco.cidade == 'MANAUS'){
                retorno = '(' + this.fields.endereco.bairro.toUpperCase() + ')';
            } else {
                retorno = '(' + this.fields.endereco.cidade.toUpperCase() + ')';
            }

            return retorno + ' ' + this.fields.endereco.logradouro;
        }

        return '';


    }

    isAberto(){
        return this.fields.situacao == Atendimento.SIT_ABERTO;
    }

    isConcluido(){
        return this.fields.situacao === Atendimento.SIT_CONCLUIDO;
    }

    isArquivado(){
        return this.fields.situacao === Atendimento.SIT_ARQUIVADO;
    }


    static from(json: string){
        return Object.assign(new Atendimento(), json);
      }

}
