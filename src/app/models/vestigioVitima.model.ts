export class VestigioVitima {

    protected tipo: string = '';
    visao   = '';


    static get TIPO_FERIMENTO() {
        return 'FERIMENTO';
    }

    static get TIPO_TATOO() {
        return 'TATOO';
    }

    static get TIPO_MANCHA() {
        return 'MANCHA';
    }

    get tipos() {
        return new Array(
            VestigioVitima.TIPO_FERIMENTO,
            VestigioVitima.TIPO_MANCHA,
            VestigioVitima.TIPO_MANCHA
        );
    }

    load(data: any) {
        this.tipo = data.tipo;
    }


}
