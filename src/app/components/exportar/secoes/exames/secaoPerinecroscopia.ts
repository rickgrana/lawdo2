import { SecaoSubExames } from './secaoSubExames'; 
import { SecaoPerinecroVitima } from './secaoPerinecroVitima'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';


export class SecaoPerinecroscopia extends SecaoSubExames{

    getTitulo(){
        return 'PERINECROSCOPIA';
    }

    async runInternal(){

        let retorno = [];

        let model = this.documento.atendimento;

        for (var vitima of model.fields.vitimas){

            console.log(vitima);

            retorno = retorno.concat(
                await (new SecaoPerinecroVitima(this.documento).setVitima(vitima).run())
            );

            console.log(retorno);
        }


        console.log(retorno);

        retorno = retorno.concat([
            new Paragraph ('')
        ]);
    
    
        retorno = retorno.concat([
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'Ainda sobre os elementos observados no local de crime, constatou o perit' + 
                                this.documento.perito.getArtigo() + ':'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'itens',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de X () estojo(s) de munição de arma de fogo, calibre X, localização, devidamente entregue(s) à Autoridade Policial no local;'
                    }),
                ]
            }),
    
    
            new Paragraph ({
                style: 'itens',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de X () massa(s) deflagrada(s) e deformada(s)  de munição de arma de fogo, localização, devidamente entregue(s) à Autoridade Policial no local;'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'itens',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A presença de mancha de sangue, localizada....'
                    }),
                ]
            }),
    
            new Paragraph ({
                style: 'itens',
                bullet: {
                    level: 0,
                },
                children: [
                    new TextRun({
                        text: 'A ausência de manchas de sangue ou outros vestígios de violêcia.'
                    }),
                ]
            }),
    
        ]);

        

        return retorno;

    }

}