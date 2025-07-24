import { Secao } from '../secao'; 

import { Paragraph, TextRun, PageNumber} from 'docx';
import { SecaoNumerada } from '../secaoNumerada';

export class SecaoOutros extends SecaoNumerada{

    getTitulo(){
        return 'OUTROS ELEMENTOS';
    }

    async runInternal(){

        let model = this.documento.atendimento;

        const qtde = model.fields.vitimas.length;

        

        return [
            new Paragraph ({
                style: 'padrao',
                keepNext: true,
                children: (!model.isCrimeVida? []:
                    [
                        new TextRun({
                            bold: true,
                            text: '\n\nPor competência legal, a descrição minuciosa do' + ((qtde > 1)?'s':'') +
                            ' cadáver' + ((qtde > 1)?'es':'')+ ', identificação, suas características, lesões consignadas, além de outras lesões eventualmente existentes, bem como a causa da morte ' +
                            ((qtde > 1)?' de cada cadáver ':'') + ' serão objeto de laudo pericial a ser expedido pelo Instituto Médico Legal desta Polícia Científica, após realização de exame necroscópico.'
                        }),
                    ]),
            })
        ];
        

    }

}