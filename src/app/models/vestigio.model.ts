export class Vestigio {

    public tipo: string = '';
    public subtipo: string = '';
    public suporte_primario: string = '';
    public localizacao: string = '';
    public descricao: string = '';
    public coletado: boolean = false;
    public entregue: boolean = false;
    public coleta_suporte: string = '';
    public coleta_encaminhada: boolean = false;
    public encaminhamento_destino: string = '';
    public encaminhamento_doc: string = '';
    public entrega_responsavel: string = '';

    static get TIPO_MANCHA() {
        return 'SANGUE';
    }

    static get TIPO_ARMA_BRANCA() {
        return 'ARMA BRANCA';
    }

    static get TIPO_ARMA_FOGO() {
        return 'ARMA DE FOGO';
    }

    static get TIPO_MUNICAO() {
        return 'MUNIÇÃO';
    }

    static get TIPO_OUTROS() {
        return 'OUTROS';
    }

    get tipos() {
        return new Array(
            Vestigio.TIPO_MANCHA,
            Vestigio.TIPO_ARMA_BRANCA,
            Vestigio.TIPO_ARMA_FOGO,
            Vestigio.TIPO_MUNICAO,
            Vestigio.TIPO_OUTROS
        );
    }

    load(data: any) {
        this.tipo = data.tipo;
        this.subtipo = data.subtipo;
        this.suporte_primario = data.suporte_primario;
        this.localizacao = data.localizacao;
        this.descricao = data.descricao;
        this.coletado = data.coletado;
        this.entregue = data.entregue;
        this.coleta_suporte = data.coleta_suporte;
        this.coleta_encaminhada = data.coleta_encaminhada;
        this.encaminhamento_destino = data.encaminhamento_destino;
        this.encaminhamento_doc = data.encaminhamento_doc;
        this.entrega_responsavel = data.entrega_responsavel;
    }

    get subtipos() {
        return [];
    }


}
