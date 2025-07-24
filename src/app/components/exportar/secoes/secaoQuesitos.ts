import { Secao } from '../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { SecaoNumerada } from '../secaoNumerada';

export class SecaoQuesitos extends SecaoNumerada{

    getTitulo(){
        return 'QUESITOS E RESPOSTAS';
    }

    isSecaoDisponivel(){
        return (this.documento.atendimento.quesitos.length > 0);
    }

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        let secoes = [
    
            new Paragraph ({
              style: 'padrao',
              children: [
                  new TextRun({
                      text: 'Em resposta aos quesitos constantes da Requisição de Perícia supracitada, ' + 
                        artigo + ' Perit' + artigo + ' Criminal responde:'
                  }),
              ],
            })
        ];
    
        let index = 0;
        let items = new Map();
    
        // items = await data.getQuesitosArray();
    
        await this.documento.atendimento.quesitos.forEach(async (item) => {
          index = index + 1;
    
          secoes = secoes.concat([
              new Paragraph ({
                  style: 'padrao',
                  keepNext: true,
                  children: [
                      new TextRun({ text: '"' + index + ') ' + item.pergunta + '"', bold: true})
                  ]
              }),
    
              new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun('Resposta: '),
                    new TextRun(item.resposta)
                ]
              })
          ]);
    
        });
    
        return secoes;
    }

}