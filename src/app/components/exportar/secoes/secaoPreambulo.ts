import { Secao } from '../secao'; 

import { DateTimeHelper } from 'src/extensions/dateTimeHelper';

import { Paragraph, TextRun} from 'docx';

export class SecaoPreambulo extends Secao{

    async runInternal(){
        const data = DateTimeHelper.dateToDMY(this.documento.atendimento.fields.data.toDate());

        const diaReceb = data.substr(0, 2);
        const mesReceb = data.substr(3, 2);
        const anoReceb = data.substr(6, 4);

        return [
            new Paragraph ({
                style: 'padrao',
                children: [

                        new TextRun(
                            '\n' + ((diaReceb == '01')?'Ao primeiro dia': 'Aos ' +  DateTimeHelper.getDiaExtenso(diaReceb) +
                                ' dias') + ' do mês de ' + DateTimeHelper.getMesExtenso(mesReceb) +
                                ' do ano de ' + anoReceb
                        +
                        ', nesta cidade de ' + this.documento.perito.unidade.cidade + ' - ' + this.documento.perito.corporacao.uf + ', ' +
                        'no ' + this.documento.perito.unidade.nome + ' - ' + this.documento.perito.unidade.sigla + 
                        ', em conformidade com a legislação ' +
                        'e com os dispositivos regulamentares vigentes, pelo(a) Diretor(a) '
                    ),

                    new TextRun({
                        text: this.documento.perito.data.superior.toUpperCase(), bold: true
                    }),

                    new TextRun(
                        ', foi designad' + this.documento.perito.getArtigo() + ' ' + this.documento.perito.getArtigo() + ' Perit' + this.documento.perito.getArtigo() + ' Criminal ',
                    ),

                    new TextRun({
                    text: this.documento.perito.data.nomeCompleto.toUpperCase(),  bold: true
                    }),

                    new TextRun(
                        ' para atender ocorrência protocolada sob número '
                    ),

                    new TextRun({
                        text: this.documento.atendimento.fields.protocolo.numero + '/' + this.documento.atendimento.fields.protocolo.ano,  bold: true
                    }),

                    new TextRun(
                        ((this.documento.atendimento.fields.requisicao.recebimento.length > 0)?
                            ', a fim de descrever com veracidade e com ' +
                            'todas as minúcias o que encontrar, bem como responder aos quesitos formulados pela autoridade policial ' +
                            'requisitante, os quais se encontram transcritos e respondidos em tópico específico deste documento.'
                        :
                            ', a fim de descrever com veracidade e com todas as minúcias o que encontrar, e bem assim esclarecer tudo quanto possa interessar.'
                        )
                    )
                ],
            })
        ];

    }

}