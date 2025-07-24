export class Orgao {

    private isNew = true;

    id: string = '';

    fields = {

        sigla:  '',
        nome: '',
        uf: '',
        cidade: '',
        status: '',

        criacao: {
            data: '',
            usuario: ''
        }
    }

    constructor() {
    }

    isNewRecord() {
        return this.isNew;
    }

    setIsNewRecord(isNew: boolean) {
        this.isNew = isNew;
    }


    static loadFrom(record: any){
        const model = new Orgao();
        model.isNew = false;
        model.load(record);

        return model;
    }


    load(data: any) {

        this.isNew = false;

        this.id = data.id;
        this.fields = data.data;

    }

    getValue(texto: any) {
        if (texto === undefined) {
            return '';
        } else {
            return texto;
        }
    }


    rawData(){
        return {
            id: this.id,
            data: this.fields
        }
    }

    toJSON(){
        return {
            id: this.id,
            sigla:  this.fields.sigla,
            nome:   this.fields.nome,
            uf:     this.fields.uf,
            cidade: this.fields.cidade,
            status: this.fields.status,
            criacao_data:  ((this.fields.criacao)?this.fields.criacao.data:null),
            criacao_usuario: ((this.fields.criacao)?this.fields.criacao.usuario:null)
        }
    }


}
