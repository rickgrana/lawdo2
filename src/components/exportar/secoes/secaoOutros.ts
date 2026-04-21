import { Paragraph, TextRun } from 'docx';
import { SecaoNumerada } from '../secaoNumerada';

export class SecaoOutros extends SecaoNumerada{

    override getTitulo(){
        return 'OUTROS ELEMENTOS';
    }

    /** art. 23: III – Outros elementos (inclui narrativa de dinâmica do evento, quando houver). */
    override isSecaoDisponivel(){
        const m = this.documento.atendimento;
        return m.isCrimeVida || (m.fields.dinamica?.length > 0);
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        const qtde = model.fields.vitimas.length;
        const artigo = this.documento.perito.getArtigo();

        const retorno: any[] = [];

        if (model.fields.dinamica?.length > 0) {
            const texto = model.fields.dinamica
                .replace(/<o>/g, artigo)
                .replace(/<O>/g, artigo.toUpperCase());
            retorno.push(
                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({ text: texto }),
                    ],
                })
            );
        }

        if (model.isCrimeVida) {
            retorno.push(
                new Paragraph ({
                    style: 'padrao',
                    keepNext: true,
                    children: [
                        new TextRun({
                            bold: true,
                            text: '\n\nPor competência legal, a descrição minuciosa do' + ((qtde > 1)?'s':'') +
                            ' cadáver' + ((qtde > 1)?'es':'')+ ', identificação, suas características, lesões consignadas, além de outras lesões eventualmente existentes, bem como a causa da morte ' +
                            ((qtde > 1)?' de cada cadáver ':'') + ' serão objeto de laudo pericial a ser expedido pelo Instituto Médico Legal desta Polícia Científica, após realização de exame necroscópico.'
                        }),
                    ],
                })
            );
        }

        return retorno;
    }
}