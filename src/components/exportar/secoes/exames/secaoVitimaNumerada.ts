import { SecaoNumerada } from '../../secaoNumerada'; 
import { SecaoVitimaIndividual } from './secaoVitimaIndividual'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Vitima } from 'src/app/models/vitima.model';

export class SecaoVitimaNumerada extends SecaoNumerada{

    private vitima!: Vitima;

    protected override estiloTitulo = 'titulo2';

    override getNivel(){
        return 2;
    }

    override getTitulo(){
        return this.getVitima().index;
    }

    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    override async runInternal(): Promise<any[]> {
        return await (new SecaoVitimaIndividual(this.documento)
                        .setVitima(this.getVitima())
                        .run()
        );
        
    }

}