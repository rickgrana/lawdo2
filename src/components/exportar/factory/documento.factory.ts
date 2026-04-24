import { Document, LineRuleType, convertMillimetersToTwip } from 'docx';
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
import { SecaoConclusao } from '../secoes/secaoConclusao';
import { SecaoAssinatura } from '../secoes/secaoAssinatura';
import { SecaoTitulo } from '../secoes/secaoTitulo';
import { SecaoRequisicao } from '../secoes/secaoRequisicao';
import { SecaoQuesitos } from '../secoes/secaoQuesitos';
import { SecaoAnexo } from '../secoes/secaoAnexo';
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
                    document: {
                        paragraph: {
                            spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        },
                    },
                    listParagraph: {
                        paragraph: {
                            spacing: { line: 360, lineRule: LineRuleType.AUTO },
                        },
                    },
                    footnoteText: {
                        paragraph: {
                            spacing: { line: 240, lineRule: LineRuleType.AUTO },
                        },
                    },
                },
                paragraphStyles: ESTILOS_PARAGRAFOS,
            },
            sections: [
                {
                    properties: {
                        page: { 
                            /* Portaria 003/2017-DPTC/AM, art. 5: sup. 1 cm, inf. 2 cm, esq. 3 cm, dir. 1,5 cm */
                            margin: {
                                top: convertMillimetersToTwip(10),
                                bottom: convertMillimetersToTwip(20),
                                left: convertMillimetersToTwip(30),
                                right: convertMillimetersToTwip(15),
                                header: convertMillimetersToTwip(10),
                                footer: convertMillimetersToTwip(20),
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

        /* art. 14: … conclusão, quesitos e respostas (ordem obrigatória) */
        secoes = secoes.concat(await (new SecaoConclusao(laudo).run())); 

        secoes = secoes.concat(await (new SecaoQuesitos(laudo).run()));

        secoes = secoes.concat(await (new SecaoAssinatura(laudo).run())); 

        secoes = secoes.concat(await (new SecaoAnexo(laudo).run())); 

        return secoes;
    }

}
