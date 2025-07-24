import { Perito } from '../perito';

import { AuthenticationService } from 'src/app/services/authentication.service';
import { CorporacaoService } from 'src/app/cadastros/corporacao/corporacao.service';
import { UnidadeService } from 'src/app/cadastros/unidade/unidade.service';

export abstract class PeritoFactory{

    constructor() 
    { 
    }

    static async create(auth: AuthenticationService,
            corporacaoService: CorporacaoService,
            unidadeService: UnidadeService
    ){
        let perito = new Perito;
        perito.data = await auth.user.fields;

        perito.corporacao     = await corporacaoService.read(perito.data.corporacao);
        perito.unidade        = await unidadeService.read(perito.data.unidade);

        return perito;
    }

}