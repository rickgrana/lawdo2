import { SecaoNumerada } from '../secaoNumerada'; 

import { Paragraph, TextRun} from 'docx';

import { DateTimeHelper } from 'src/extensions/dateTimeHelper';

export class SecaoHistorico extends SecaoNumerada{

    getTitulo(){
        return 'HISTÓRICO';
    }

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        const dataAux = DateTimeHelper.dateToDMY(model.fields.data.toDate());

        let retorno = [
            
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'Às ' + model.fields.hora.substr(11, 2) + 'h' + model.fields.hora.substr(14, 2) + 'min do dia ' +
                        dataAux +
                        ', atendendo ao protocolo supracitado via chamado da radiofonia, ' + artigo + 
                        ' perit' + artigo + ' compareceu ao local ' +
                        'indicado onde realizou os exames que se faziam necessários, os quais passam a ser relatados nos ' +
                        'termos do presente laudo'
                    }),
    
                    (model.fields.requisicao.recebimento.length > 0)?
                        new TextRun(''):
                        new TextRun({text: ', emitido sem que a Requisição de Perícia correspondente tenha sido recebida até a presente data', bold: true}),
                    
                    new TextRun('.')
                ],
            }),
        ];
    
        if(model.fields.requisicao.recebimento.length){
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({
                            text: 'Este laudo visa responder à Requisição de Perícia S/N, ' +
                            'recebida pel' + artigo + ' perit' + artigo + ' em ' +
                            model.fields.requisicao.recebimento.substr(0, 2) + '/' + model.fields.requisicao.recebimento.substr(3, 2) + '/' +
                            model.fields.requisicao.recebimento.substr(6, 4) +
                            ', expedida pela ' + model.fields.requisicao.origem +
                            ' e assinada pelo(a) Delegado(a) de Polícia Civil ' + model.fields.requisicao.delegado + '.',
                        }),
                    ],
                }),
            ]);
        }


        console.log(retorno);
    
        return retorno;
    }



}