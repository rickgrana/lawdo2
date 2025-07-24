import { SecaoNumerada } from '../../secaoNumerada'; 
import { SecaoVitimaIndividual } from './secaoVitimaIndividual'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Vitima } from 'src/app/models/vitima.model';

export class SecaoVitimaNumerada extends SecaoNumerada{

    private vitima: Vitima;

    protected estiloTitulo = 'titulo2';

    getNivel(){
        return 2;
    }

    getTitulo(){
        return this.getVitima().index;
    }

    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    async runInternal(){
        return await (new SecaoVitimaIndividual(this.documento)
                        .setVitima(this.getVitima())
                        .run()
        );
        
    }

}