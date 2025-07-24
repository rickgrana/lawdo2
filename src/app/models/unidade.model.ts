import { Base } from "./base.model";

export class Unidade extends Base {

    override fields = {
        sigla:  '',
        corporacao:   '',
        nome: '',
        status: '',

        criacao: {
            data: '',
            usuario: ''
        }
    }

    static override loadFrom(record: any){
        const model = new Unidade();
        model.isNew = false;
        model.load(record);

        return model;
    }
}
