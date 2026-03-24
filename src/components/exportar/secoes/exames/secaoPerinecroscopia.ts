import { SecaoSubExames } from './secaoSubExames'; 
import { SecaoPerinecroVitima } from './secaoPerinecroVitima'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';


export class SecaoPerinecroscopia extends SecaoSubExames{

    override getTitulo(){
        return 'PERINECROSCOPIA';
    }

    override async runInternal(): Promise<any[]> {

        let retorno: any[] = [];

        let model = this.documento.atendimento;

        for (var vitima of model.fields.vitimas){
            retorno = retorno.concat(
                await (new SecaoPerinecroVitima(this.documento).setVitima(vitima).run())
            );
        }

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
                style: 'Normal',
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
                style: 'Normal',
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
                style: 'Normal',
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
                style: 'Normal',
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