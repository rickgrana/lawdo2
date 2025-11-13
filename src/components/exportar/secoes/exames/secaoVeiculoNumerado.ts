import { SecaoNumerada } from '../../secaoNumerada'; 
import { SecaoVeiculoIndividual } from './secaoVeiculoIndividual'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Veiculo } from 'src/app/models/veiculo.model';

export class SecaoVeiculoNumerado extends SecaoNumerada{

    private veiculo: Veiculo;

    protected estiloTitulo = 'titulo2';

    getTitulo(){
        return this.getVeiculo().index;
    }

    setVeiculo(veiculo: Veiculo){
        this.veiculo = veiculo;

        return this;
    }

    getVeiculo(){
        return this.veiculo;
    }

    async runInternal(){
        return await (new SecaoVeiculoIndividual(this.documento)
                        .setVeiculo(this.getVeiculo())
                        .run()
        );
        
    }

}