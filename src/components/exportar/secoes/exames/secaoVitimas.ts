import { SecaoSubExames } from './secaoSubExames'; 
import { INDICE_NUMERADO } from '../../secaoNumerada';

import { NumberHelper } from 'src/extensions/numberHelper';

import { SecaoVitimaIndividual } from './secaoVitimaIndividual'; 
import { SecaoVitimaNumerada } from './secaoVitimaNumerada';

export class SecaoVitimas extends SecaoSubExames{

    capitulo: String;

    protected subIndices = INDICE_NUMERADO;

    getTitulo(){
        if(this.documento.atendimento.fields.vitimas.length > 1)
            return 'CADÁVERES EXAMINADOS';
        else 
            return 'CADÁVER EXAMINADO';
    }

    isSecaoDisponivel(){
        return (this.documento.atendimento.fields.vitimas.length > 0);
    }

    isMultiplasVitimas(){
        return this.documento.atendimento.fields.vitimas.length > 1;
    }

    async runInternal(){
        
        // UNICA VITIMA
        if(!this.isMultiplasVitimas()){

            let vitima = this.documento.atendimento.fields.vitimas[0];
            vitima.index = 'VÍTIMA';

            return await (new SecaoVitimaIndividual(this.documento).setVitima(vitima).run());
        }

        let retorno = [];
        let index = 0;
    
        // MULTIPLAS VITIMAS
        //await this.documento.atendimento.fields.vitimas.forEach(async (vitima, index) => {
        for (let vitima of this.documento.atendimento.fields.vitimas) {

            index ++;

            vitima.index = 'VÍTIMA ' + NumberHelper.getRomano(index);

            let textoVitima = await (new SecaoVitimaNumerada(this.documento).setVitima(vitima).run());

            retorno = retorno.concat(textoVitima);
        };

        console.log(retorno);
    
    
        return retorno;
    }

}