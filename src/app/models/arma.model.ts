export class Arma {


    tipo = 0;

    static get ARMA_DE_FOGO() {
        return 'ARMA_FOGO';
    }

    static get ARMA_BRANCA() {
        return 'ARMA_BRANCA';
    }

    static get natureza() {
        return {
            ARMA_DE_FOGO: 'ARMA DE FOGO',
            ARMA_BRANCA: 'ARMA_BRANCA',
        };
    }

}