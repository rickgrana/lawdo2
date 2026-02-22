import { SecaoNumerada } from '../secaoNumerada'; 

import { Paragraph, TextRun} from 'docx';


export class SecaoConclusao extends SecaoNumerada{

    override getTitulo(){
        return 'CONCLUSÃO';
    }

    override isSecaoDisponivel(){
        return (this.documento.atendimento.fields.conclusao.length > 0);
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        let artigo = this.documento.perito.getArtigo();
        let texto = model.fields.conclusao
                        .replace(/<o>/g, artigo)
                        .replace(/<O>/g, artigo.toUpperCase());

        
        let retorno: any[] = [];
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