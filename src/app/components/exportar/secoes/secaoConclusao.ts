import { SecaoNumerada } from '../secaoNumerada'; 

import { Paragraph, TextRun} from 'docx';


export class SecaoConclusao extends SecaoNumerada{

    getTitulo(){
        return 'CONCLUSÃO';
    }

    isSecaoDisponivel(){
        return (this.documento.atendimento.fields.conclusao.length > 0);
    }

    async runInternal(){

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();
        let texto = model.fields.conclusao
                        .replace(/<o>/g, artigo)
                        .replace(/<O>/g, artigo.toUpperCase());

        
        let retorno = [];

       
        retorno = retorno.concat([

            new Paragraph ({
                        style: 'padrao',
                        children: [
                            new TextRun(texto),
                        ]
                    })
        ]);

        return retorno;
    }



}