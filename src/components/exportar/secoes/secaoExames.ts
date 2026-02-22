import { SecaoNumerada } from '../secaoNumerada'; 
import { SecaoIsolamento } from './exames/secaoIsolamento';
import { SecaoLocal } from './exames/secaoLocal'; 
import { SecaoPerinecroscopia } from './exames/secaoPerinecroscopia';
import { SecaoVitimas } from './exames/secaoVitimas';
import { SecaoVeiculos } from './exames/secaoVeiculos';

export class SecaoExames extends SecaoNumerada{

    capitulo: String = '';

    override getTitulo(){
        return 'EXAMES';
    }

    override async runInternal(): Promise<any[]> {

        let secoes: any[] = [];

        secoes = secoes.concat(await (new SecaoLocal(this.documento, this).run())); 

        secoes = secoes.concat(await (new SecaoIsolamento(this.documento, this).run())); 

        secoes = secoes.concat(await (new SecaoVitimas(this.documento, this).run())); 

        secoes = secoes.concat(await (new SecaoVeiculos(this.documento, this).run())); 

        secoes = secoes.concat(await (new SecaoPerinecroscopia(this.documento, this).run())); 
        

        return secoes;

    }

}