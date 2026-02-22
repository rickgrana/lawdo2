import { SecaoNumerada } from '../../secaoNumerada'; 
import { SecaoVeiculoIndividual } from './secaoVeiculoIndividual'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { Veiculo } from 'src/app/models/veiculo.model';

export class SecaoVeiculoNumerado extends SecaoNumerada{

    private veiculo!: Veiculo;

    protected override estiloTitulo = 'titulo2';

    override getTitulo(){
        return this.getVeiculo().index;
    }

    setVeiculo(veiculo: Veiculo){
        this.veiculo = veiculo;

        return this;
    }

    getVeiculo(){
        return this.veiculo;
    }

    override async runInternal(): Promise<any[]> {
        return await (new SecaoVeiculoIndividual(this.documento)
                        .setVeiculo(this.getVeiculo())
                        .run()
        );
        
    }

}