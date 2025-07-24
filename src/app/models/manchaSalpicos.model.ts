import { Mancha } from './mancha.model';

export class ManchaSalpicos extends Mancha {

    static get PADRAO_MANCHA() {
        return 'MANCHA DE SALPICOS';
    }

    static get PADRAO_BORRIFO() {
        return 'BORRIFO';
    }

    static get PADRAO_IMPACTO() {
        return 'IMPACTO';
    }

    static get PADRAO_PROJETADO() {
        return 'PROJEÇÃO';
    }

    static get PADRAO_SALPICO_DIANTERO() {
        return 'RASTRO PARA A FRENTE';
    }

    static get PADRAO_SALPICO_TRASEIRO() {
        return 'RASTRO PARA TRÁS';
    }

    static get PADRAO_ARTERIAL() {
        return 'SANGUE ARTERIAL';
    }

    static get PADRAO_NEVOA() {
        return 'NEVOEIRO';
    }

    static get PADRAO_LANCAMENTO() {
        return 'LANÇAMENTO';
    }

    static get PADRAO_EXPETORACAO(){
        return 'EXPETORAÇÃO';
    }


    get padroes() {
        return new Array(
            ManchaSalpicos.PADRAO_MANCHA,
            ManchaSalpicos.PADRAO_BORRIFO,
            ManchaSalpicos.PADRAO_IMPACTO,
            ManchaSalpicos.PADRAO_PROJETADO,
            ManchaSalpicos.PADRAO_SALPICO_DIANTERO,
            ManchaSalpicos.PADRAO_SALPICO_TRASEIRO,
            ManchaSalpicos.PADRAO_ARTERIAL,
            ManchaSalpicos.PADRAO_NEVOA,
            ManchaSalpicos.PADRAO_LANCAMENTO,
            ManchaSalpicos.PADRAO_EXPETORACAO
        );
    }


}
