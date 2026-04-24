import { DateTimeHelper } from 'src/app/extensions/dateTimeHelper';
import { Secao } from '../secao'; 
import { Paragraph, TextRun} from 'docx';

export class SecaoPreambulo extends Secao{

    override async runInternal(): Promise<any[]> {
        const data = DateTimeHelper.dateToDMY(new Date(this.documento.atendimento.fields.data)) || '';

        const diaReceb = data.substr(0, 2);
        const mesReceb = data.substr(3, 2);
        const anoReceb = data.substr(6, 4);

        return [
            new Paragraph ({
                style: 'padrao',
                children: [

                        new TextRun(
                            ((diaReceb == '01')?'Ao primeiro dia': 'Aos ' +  DateTimeHelper.getDiaExtenso(diaReceb) +
                                ' dias') + ' do mês de ' + DateTimeHelper.getMesExtenso(mesReceb) +
                                ' do ano de ' + anoReceb
                        +
                        ', nesta cidade de ' + this.documento.perito.unidade.cidade + ' - ' + this.documento.perito.corporacao.uf + ', ' +
                        'no ' + this.documento.perito.unidade.nome + ' - ' + this.documento.perito.unidade.sigla + 
                        ', em conformidade com a legislação ' +
                        'e com os dispositivos regulamentares vigentes, pelo(a) Diretor(a) Perito Criminal '
                    ),

                    /* art. 15 §1: nomes em maiúsculas, sem negrito */
                    new TextRun({
                        text: this.documento.perito.data.superior.toUpperCase(),
                    }),

                    new TextRun(
                        ', foi designad' + this.documento.perito.getArtigo() + ' ' + this.documento.perito.getArtigo() + ' Perit' + this.documento.perito.getArtigo() + ' Criminal ',
                    ),

                    new TextRun({
                    text: this.documento.perito.data.nomeCompleto.toUpperCase(),
                    }),

                    new TextRun(
                        ' para proceder a exames periciais, descrevendo com veracidade e com todas as minúcias o que encontrar, descobrir e observar, bem como responder aos quesitos formulados pela autoridade requisitante, os quais se encontram transcritos e respondidos em tópico específico deste documento. '
                    )
                ],
            })
        ];
    }
}