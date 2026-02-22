import { SecaoNumerada } from '../secaoNumerada'; 

import { Paragraph, TextRun} from 'docx';


export class SecaoDinamica extends SecaoNumerada{

    override getTitulo(){
        return 'POSSÍVEL DINÂMICA DO EVENTO';
    }

    override isSecaoDisponivel(){
        return (this.documento.atendimento.fields.dinamica.length > 0);
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();

        let texto = model.fields.dinamica
                        .replace(/<o>/g, artigo)
                        .replace(/<O>/g, artigo.toUpperCase());

        return [
           
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: texto
                    }),
                ]
            })
        ];
    }



}