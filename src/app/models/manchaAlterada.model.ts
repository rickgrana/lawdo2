import { Mancha } from './mancha.model';

export class ManchaAlterada extends Mancha {

    static get PADRAO_LIMPEZA() {
        return 'LIMPEZA';
    }

    static get PADRAO_COAGULO() {
        return 'COÁGULO DE SANGUE';
    }

    static get PADRAO_SORO() {
        return 'MANCHA DE SORO';
    }

    static get PADRAO_PERIMETRO() {
        return 'PERÍMETRO';
    }

    

    get padroes() {
        return new Array(
            ManchaAlterada.PADRAO_LIMPEZA,
            ManchaAlterada.PADRAO_COAGULO,
            ManchaAlterada.PADRAO_SORO,
            ManchaAlterada.PADRAO_PERIMETRO
        );
    }


}