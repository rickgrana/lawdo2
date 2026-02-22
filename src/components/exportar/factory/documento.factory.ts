import { Document } from 'docx';
//import { UpdateFields } from 'docx/src/file/settings/update-fields';

import { Atendimento } from 'src/app/models/atendimento.model'; 
import { Documento } from '../documento';
import { Secao } from '../secao'; 
import { Cabecalho } from '../cabecalho'; 
import { Rodape } from '../rodape'; 

import { PeritoFactory } from './perito.factory';

import { ESTILOS_PARAGRAFOS } from '../styles';
import { NUMBERING } from '../numbering';
import { SecaoPreambulo } from '../secoes/secaoPreambulo';
import { SecaoHistorico } from '../secoes/secaoHistorico';
import { SecaoLocal } from '../secoes/exames/secaoLocal';
import { SecaoExames } from '../secoes/secaoExames';
import { SecaoOutros } from '../secoes/secaoOutros';
import { SecaoDinamica } from '../secoes/secaoDinamica';
import { SecaoConclusao } from '../secoes/secaoConclusao';
import { SecaoAssinatura } from '../secoes/secaoAssinatura';
import { SecaoTitulo } from '../secoes/secaoTitulo';
import { SecaoRequisicao } from '../secoes/secaoRequisicao';
import { SecaoQuesitos } from '../secoes/secaoQuesitos';
import { SecaoAnexo } from '../secoes/secaoAnexo';
import { AuthenticationService } from 'src/app/authentication.service';
import { CorporacaoService } from 'src/app/services/corporacao.service';
import { UnidadeService } from 'src/app/services/unidade.service';
import { Perito } from '../perito';

export class DocumentoFactory{


    static async create(atendimento: Atendimento, perito: Perito){

        let laudo = new Documento(atendimento, perito);

        laudo.atendimento = atendimento;
        laudo.docx = new Document({

            creator: laudo.getCreator(),
            description: 'Laudo ' + laudo.getNumeroLaudo(),
            title: 'LAUDO ' + laudo.getNumeroLaudo(),

            numbering: {
                config: NUMBERING
            },

            styles: {
                default: {
                },
                paragraphStyles: ESTILOS_PARAGRAFOS,
            },
            sections: [
                {
                    properties: {
                        page: { 
                            margin: {
                                header: 1133.144 * 1 / 2,
                                footer: 1133.144,
                                left: 1133.144 * 3 / 2,
                                top: 1133.144 * 1 / 2,
                                right: 1133.144,
                                bottom: 1133.144,
                            },
                        },
                    },

                    headers: {
                        default: await Cabecalho.run(laudo)
                    },
                    
                    footers: {
                        default: await Rodape.run(laudo)
                    },

                    children: await DocumentoFactory.getBody(laudo)
                },
            ],
        });
        
        return laudo;
    }


    static async getBody(laudo: Documento){

        let secoes: any[] = [];

        secoes = secoes.concat(await (new SecaoRequisicao(laudo).run())); 

        secoes = secoes.concat(await (new SecaoTitulo(laudo).run())); 

        secoes = secoes.concat(await (new SecaoPreambulo(laudo).run())); 

        secoes = secoes.concat(await (new SecaoHistorico(laudo).run())); 

        secoes = secoes.concat(await (new SecaoExames(laudo).run())); 

        secoes = secoes.concat(await (new SecaoOutros(laudo).run())); 

        secoes = secoes.concat(await (new SecaoDinamica(laudo).run())); 

        secoes = secoes.concat(await (new SecaoQuesitos(laudo).run()));

        secoes = secoes.concat(await (new SecaoConclusao(laudo).run())); 

        secoes = secoes.concat(await (new SecaoAssinatura(laudo).run())); 

        secoes = secoes.concat(await (new SecaoAnexo(laudo).run())); 

        return secoes;
    }

}
