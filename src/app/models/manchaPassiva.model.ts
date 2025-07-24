import { Mancha } from './mancha.model';

export class ManchaPassiva extends Mancha {

    static get PADRAO_GOTA() {
        return 'MANCHA SIMPLES DE GOTA';
    }

    static get PADRAO_GOTAS() {
        return 'MÚLTIPLAS GOTAS';
    }

    static get PADRAO_POCA() {
        return 'POÇA';
    }

    static get PADRAO_RASTRO() {
        return 'RASTRO DE GOTAS';
    }

    static get PADRAO_FLUXO() {
        return 'ESCORRIMENTO';
    }

    static get PADRAO_TRANSFERENCIA() {
        return 'TRANSFERÊNCIA';
    }

    static get PADRAO_MOVIMENTO() {
        return 'MOVIMENTO';
    }

    static get PADRAO_SATURACAO() {
        return 'MANCHA DE SATURAÇÃO';
    }

    

    get padroes() {
        return new Array(
            ManchaPassiva.PADRAO_GOTA,
            ManchaPassiva.PADRAO_GOTAS,
            ManchaPassiva.PADRAO_RASTRO,
            ManchaPassiva.PADRAO_POCA,
            ManchaPassiva.PADRAO_FLUXO,
            ManchaPassiva.PADRAO_TRANSFERENCIA,
            ManchaPassiva.PADRAO_SATURACAO
        );
    }


}