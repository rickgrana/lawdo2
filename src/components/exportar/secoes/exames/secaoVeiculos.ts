import { SecaoSubExames } from './secaoSubExames'; 
import { INDICE_NUMERADO } from '../../secaoNumerada';
import { SecaoVeiculoIndividual } from './secaoVeiculoIndividual'; 
import { SecaoVeiculoNumerado } from './secaoVeiculoNumerado';
import { NumberHelper } from 'src/app/extensions/numberHelper';

export class SecaoVeiculos extends SecaoSubExames{

    capitulo: String = '';

    protected override subIndices = INDICE_NUMERADO;

    override getTitulo(){
        if(this.documento.atendimento.fields.veiculos.length > 1)
            return 'VEÍCULOS EXAMINADOS';
        else 
            return 'VEÍCULO EXAMINADO';
    }

    override isSecaoDisponivel(){
        return (this.documento.atendimento.fields.veiculos.length > 0);
    }

    isMultiplosVeiculos(){
        return this.documento.atendimento.fields.veiculos.length > 1;
    }

    override async runInternal(): Promise<any[]> {
        
        // UNICA VITIMA
        if(!this.isMultiplosVeiculos()){

            let veiculo = this.documento.atendimento.fields.veiculos[0];
            veiculo.index = 'VEÍCULO';

            return await (new SecaoVeiculoIndividual(this.documento).setVeiculo(veiculo).run());
        }

        let retorno: any[] = [];
        let index = 0;
    
        // MULTIPLOS VEICULOS
        for (let veiculo of this.documento.atendimento.fields.veiculos) {

            index++;

            veiculo.index = NumberHelper.getRomano(index);

            let texto = await (new SecaoVeiculoNumerado(this.documento, this).setVeiculo(veiculo).run());

            retorno = retorno.concat(texto);
        };
    
    
        return retorno;
    }

}