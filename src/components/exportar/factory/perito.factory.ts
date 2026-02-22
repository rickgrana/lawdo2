import { Injectable } from '@angular/core';
import { Perito } from '../perito';
import { CorporacaoService } from 'src/app/services/corporacao.service';
import { UnidadeService } from 'src/app/services/unidade.service';
import { User } from 'src/app/models/user.model';

@Injectable({ providedIn: 'root' })
export class PeritoFactory{

    constructor(private corporacaoService: CorporacaoService,
        private unidadeService: UnidadeService) 
    { 
    }

    async create(user: User): Promise<Perito>{
        let perito = new Perito();
        perito.data = user.fields;

        if (!perito.data.corporacao || !perito.data.unidade) {
            throw new Error('Perito deve conter corporacao e unidade nas configurações da Conta');
        }
        
        perito.corporacao   = await this.corporacaoService.read(perito.data.corporacao);
        perito.unidade      = await this.unidadeService.read(perito.data.unidade);
        return perito;
    }

}