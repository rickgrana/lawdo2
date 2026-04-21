import { Paragraph, TextRun } from 'docx';
import { SecaoNumerada } from '../secaoNumerada';

export class SecaoQuesitos extends SecaoNumerada{

    override getTitulo(){
        return 'QUESITOS E RESPOSTAS';
    }

    override isSecaoDisponivel(){
        return (this.documento.atendimento.quesitos.length > 0);
    }

    override async runInternal(): Promise<any[]> {

        let secoes: any[] = [];
    
        let index = 0;
    
        this.documento.atendimento.quesitos.forEach((item) => {
          index = index + 1;
    
          secoes = secoes.concat([
              new Paragraph ({
                  style: 'quesito_identificacao',
                  keepNext: true,
                  children: [
                      /* art. 14 §3 I: quesito na íntegra, em negrito, entre aspas */
                      new TextRun({ text: '"' + item.pergunta + '"', bold: true}),
                  ]
              }),
    
              new Paragraph ({
                style: 'quesito_resposta',
                spacing: { after: index < this.documento.atendimento.quesitos.length ? 360 : 0 },
                children: [
                    new TextRun(item.resposta ?? ''),
                ]
              })
          ]);
    
        });
    
        return secoes;
    }

}