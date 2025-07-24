import { Vestigio } from './vestigio.model';

export class Mancha extends Vestigio {

    public padrao: string = '';

    static get SUBTIPO_PASSIVA() {
        return 'PASSIVA';
    }

    static get SUBTIPO_SALPICOS() {
        return 'SALPICOS';
    }

    static get SUBTIPO_ALTERADA() {
        return 'ALTERADA';
    }

    get subtipos() {
        return new Array(
            Mancha.SUBTIPO_PASSIVA,
            Mancha.SUBTIPO_SALPICOS,
            Mancha.SUBTIPO_ALTERADA
        );
    }

    get padroes() {
        return [];
    }


}
