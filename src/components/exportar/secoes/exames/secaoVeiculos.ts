import { SecaoSubExames } from './secaoSubExames'; 
import { INDICE_NUMERADO } from '../../secaoNumerada';

import { NumberHelper } from 'src/extensions/numberHelper';

import { SecaoVeiculoIndividual } from './secaoVeiculoIndividual'; 
import { SecaoVeiculoNumerado } from './secaoVeiculoNumerado';

export class SecaoVeiculos extends SecaoSubExames{

    capitulo: String;

    protected subIndices = INDICE_NUMERADO;

    getTitulo(){
        if(this.documento.atendimento.fields.veiculos.length > 1)
            return 'VEÍCULOS EXAMINADOS';
        else 
            return 'VEÍCULO EXAMINADO';
    }

    isSecaoDisponivel(){
        return (this.documento.atendimento.fields.veiculos.length > 0);
    }

    isMultiplosVeiculos(){
        return this.documento.atendimento.fields.veiculos.length > 1;
    }

    async runInternal(){
        
        // UNICA VITIMA
        if(!this.isMultiplosVeiculos()){

            let veiculo = this.documento.atendimento.fields.veiculos[0];
            veiculo.index = 'VEÍCULO';

            return await (new SecaoVeiculoIndividual(this.documento).setVeiculo(veiculo).run());
        }

        let retorno = [];
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