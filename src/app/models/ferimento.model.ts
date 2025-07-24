import { Vestigio } from './vestigio.model';

export class Ferimento extends Vestigio {

    natureza: string;
    x   = 0;
    y   = 0;

    constructor() {
        super();
        this.tipo = Vestigio.TIPO_FERIMENTO;
    }

    static get NATUREZAS() {
        return {
            INCISO: 'inciso',
            CONTUSO: 'contuso',
            CORTO_CONTUSO: 'corto-contuso',
            LACERO_CONTUSO: 'lácero-contuso',
            PERFURANTE: 'perfurante',
            PERFURO_CONTUSO: 'pérfuro-contuso',
            PERFURO_CORTANTE: 'pérfuro-cortante'
        };
    }

    static get PROFUNDIDADES() {
        return {
            SUPERFICIAL: 'superficial',
            PROFUNDO: 'profundo'
        };
    }
}
