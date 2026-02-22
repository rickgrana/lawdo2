import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { SecaoNumerada } from '../secaoNumerada'; 

import { Paragraph, TextRun} from 'docx';

export class SecaoHistorico extends SecaoNumerada{

    override getTitulo(){
        return 'HISTÓRICO';
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        const dataAux = DateTimeHelper.dateToDMY(new Date(model.fields.data));
        //const hora = (model.fields.hora.toDate().toLocaleTimeString('pt-BR')

        let retorno = [
            
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'Às ' + model.fields.hora.substr(0, 2) + 'h' + model.fields.hora.substr(3, 2) + 'min do dia ' +
                        dataAux +
                        ', atendendo ao protocolo supracitado via chamado da radiofonia, ' + artigo + 
                        ' perit' + artigo + ' compareceu ao local ' +
                        'indicado onde realizou os exames que se faziam necessários, os quais passam a ser relatados nos ' +
                        'termos do presente laudo'
                    }),
    
                    (model.fields.requisicao.numero.length > 0)?
                        new TextRun(''):
                        new TextRun({text: ', emitido sem que a Requisição de Perícia correspondente tenha sido recebida até a presente data', bold: true}),
                    
                    new TextRun('.')
                ],
            }),
        ];
    
        if(model.fields.requisicao.numero.length){
            const dtRecebimento = DateTimeHelper.dateToDMY(new Date(model.fields.requisicao.recebimento)) || '';
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({
                            text: 'Este laudo visa responder à Requisição de Perícia ' +
                            (model.fields.requisicao.numero ?? 'S/N') + ', ' +
                            'recebida pel' + artigo + ' perit' + artigo + ' em ' +
                            dtRecebimento + 
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