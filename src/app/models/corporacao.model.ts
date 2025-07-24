import { Base } from "./base.model";

export class Corporacao extends Base {

    override fields = {
        sigla:  '',
        uf:   '',
        nome: ''
    }

    static override loadFrom(record: any){
        const model = new Corporacao();
        model.isNew = false;
        model.load(record);

        return model;
    }
}
