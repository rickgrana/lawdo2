import { Secao } from '../secao'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';

export class SecaoRequisicao extends Secao{

    async runInternal(){

        let model = this.documento.atendimento;

        if(model.fields.requisicao && model.fields.requisicao.recebimento){
            return this.getTextoComRequisicao(model);
        }else{
            return this.getTextoSemRequisicao(model);
        }

    }

    getTextoSemRequisicao(model: Atendimento){
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Laudo sem Requisição de Perícia',
                        bold: true
                    })
                ]
            }),    

            new Paragraph({
                children: [
                    new TextRun({
                        text: 'DIP a ser encaminhado: DEHS',
                        bold: true
                    })
                ]
            }),  

            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Protocolo: '
                    }),
                    new TextRun({
                    text: model.fields.protocolo.numero + '/' + model.fields.protocolo.ano,
                    bold: true
                })
                ]
            }),
        ];
    }

    getTextoComRequisicao(model: Atendimento){

        return[
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Requisitante: '
                    }),
                    new TextRun({
                        text: model.fields.requisicao.origem,
                        bold: true
                    })
                ]
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Protocolo: '
                    }),
                    new TextRun({
                    text: model.fields.protocolo.numero + '/' + model.fields.protocolo.ano,
                    bold: true
                })
                ]
            }),

            new Paragraph({
                children: [
                    new TextRun({
                        text: model.fields.requisicao.ip
                    })
                ]
                }),
        
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Destino: '
                        }),
                        new TextRun({
                        text: ((model.fields.requisicao.destino === '') ? model.fields.requisicao.origem : model.fields.requisicao.destino),
                        bold: true
                    })
                    ]
                })
        ];
    }

    

}