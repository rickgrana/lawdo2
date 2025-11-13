import { Documento } from './documento';

export class Secao {

    public documento: Documento;

    constructor (documento: Documento){
        this.documento = documento;
    }

    async run(){
        if(this.isSecaoDisponivel()){
            return await this.runInternal();
        }

        return [];
    }

    async runInternal(){
        return [];
    }

    isSecaoDisponivel(){
        return true;
    }
}