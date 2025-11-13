import { SecaoSubExames } from './secaoSubExames'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';


export class SecaoLocal extends SecaoSubExames{

    getTitulo(){
        return 'LOCAL';
    }

    async runInternal(){

        const texto = [];

        let model = this.documento.atendimento;

        texto.push(
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({ text: 'O local imediato (Imagem 01)' }),
                    new TextRun({ text: ' tratava-se de '}),
                    new TextRun({ text: model.fields.local.natureza, bold: true}),
                    new TextRun({ text: (model.isPossuiFuncao() ? ' ' + model.getFuncaoText() : '')}),
                    new TextRun({ text: (model.isPossuiTipo() ? ', do tipo ' + model.getTipoText() + ',' : '')}),
                    new TextRun({ text: (model.isPossuiConstrucao() ? ' ' + model.getConstrucaoText() : '') }),

                    new TextRun({ text: ', situado no logradouro ' }),
                    new TextRun({ text: model.fields.endereco.logradouro.toUpperCase(), bold: true}),
                    new TextRun({ text: ((model.fields.endereco.cidade === 'MANAUS') ? ', bairro ' : '')}),
                    new TextRun({ text: ((model.fields.endereco.cidade === 'MANAUS') ? model.fields.endereco.bairro.toUpperCase() : ''), bold: true}),
                    new TextRun({ text: ', zona ' + model.fields.local.zona + ' da cidade de '}),
                    new TextRun({ text: model.fields.endereco.cidade + '/AM', bold: true }),

                    new TextRun({ text: ((model.fields.endereco.pontoref.length > 0) ? ',  ' + model.fields.endereco.pontoref : '')}),
                    new TextRun({ text: ((model.fields.local.acesso.length > 0) ? ', com acesso via ' + model.fields.local.acesso : '')}),

                    new TextRun('.')
                ],
            })

            
        );

        if (model.fields.local.descricao && model.fields.local.descricao.length){
            texto.push(
                new Paragraph ({
                    style: 'padrao',
                    children: [
                        new TextRun({ text: 'O perit' + this.documento.perito.getArtigo() + ' descreve o local como '
                            + model.fields.local.descricao + '.'})
                    ]
                })
            );
        }

        return texto;

    }

}