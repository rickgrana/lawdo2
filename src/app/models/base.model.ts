export class Base {

    protected isNew = true;

    id: string = '';

    fields = {
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
    }


    load(data: any) {
        this.isNew = false;
        this.id = data.id;
        this.fields = data.data;
    }

    rawData() : any{
        return {
            id: this.id,
            data: this.fields
        }
    }

    getValue(texto: any) {
        if (texto === undefined) {
            return '';
        } else {
            return texto;
        }
    }
}
