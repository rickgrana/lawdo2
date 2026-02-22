import { Documento } from './documento';

export class Secao {

    public documento: Documento;

    constructor (documento: Documento){
        this.documento = documento;
    }

    async run(): Promise<any[]> {
        if(this.isSecaoDisponivel()){
            return await this.runInternal();
        }

        return [];
    }

    async runInternal(): Promise<any[]> {
        return [];
    }

    isSecaoDisponivel(){
        return true;
    }
}