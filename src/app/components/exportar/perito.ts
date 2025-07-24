import { ThrowStmt } from '@angular/compiler';

export class Perito{

    data: any;

    corporacao: any;
    unidade: any;

    getArtigo(){
        if (this.data.sexo === 'F') {
            return 'a';
        }

        return 'o';
    }

    getCorporacao(){
        return this.corporacao;
    }

    getUnidade(){
        return this.unidade;
    }
}