import { Paragraph, TextRun, convertMillimetersToTwip } from 'docx';
import { SecaoNumerada } from '../secaoNumerada';

const RECUO_ESQUERDO_QUESITO_MM = 25;

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
                  indent: { left: convertMillimetersToTwip(RECUO_ESQUERDO_QUESITO_MM), firstLine: 0 },
                  children: [
                      /* art. 14 §3 I: quesito na íntegra, em negrito, entre aspas */
                      new TextRun({ text: '"' + item.pergunta + '"', bold: true, font: 'Times New Roman', size: 24 }),
                  ]
              }),
    
              new Paragraph ({
                style: 'quesito_resposta',
                indent: { left: convertMillimetersToTwip(RECUO_ESQUERDO_QUESITO_MM), firstLine: 0 },
                spacing: { after: index < this.documento.atendimento.quesitos.length ? 360 : 0 },
                children: [
                    new TextRun({ text: item.resposta ?? '', font: 'Times New Roman', size: 24 }),
                ]
              })
          ]);
    
        });
    
        return secoes;
    }

}