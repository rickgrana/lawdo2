import { SecaoSubExames } from './secaoSubExames'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento } from 'src/app/models/atendimento.model';


export class SecaoIsolamento extends SecaoSubExames{

    getTitulo(){
        return 'ISOLAMENTO E PRESERVAÇÃO DO LOCAL';
    }

    isSecaoDisponivel(){

        let local = this.documento.atendimento.fields.local;

        return (local.isolamento.length > 0) || (local.preservacao.length > 0);
    }

    async runInternal(){


        let model = this.documento.atendimento;

        let retorno = [
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({ text: 'Além d' + this.documento.perito.getArtigo() + ' perit' + this.documento.perito.getArtigo() + 
                        ', estiveram presentes ao local do crime: '})
                ]
            })
        ];

        if(model.fields.equipes.pm.representante.length > 0){

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'itens',
                    bullet: {
                        level: 1,
                    },
                    children: [
                        new TextRun({ text: model.fields.equipes.pm.representante, bold: true }),
                        new TextRun({ text: ' (Polícia Militar, '}),
                        new TextRun({ text: model.fields.equipes.pm.origem }),
                        new TextRun({ text: ', VTR Nº'}),
                        new TextRun({ text: model.fields.equipes.pm.vtr }),
                        new TextRun({ text: ')' }),
                    ],
                }),
            ]);
        }


        let equipe_pc = [];

        if(model.fields.equipes.pc.delegado.length > 0){

            equipe_pc = [
                new TextRun({ text: 'Delegado '}),
                new TextRun({ text: model.fields.equipes.pc.delegado, bold: true }),
            ];
        }

        if(model.fields.equipes.pc.investigacao.length > 0){

            if(equipe_pc.length > 0){
                equipe_pc = equipe_pc.concat([
                    new TextRun({ text: ' e o(s) investigador(es) '}),
                    new TextRun({ text: model.fields.equipes.pc.investigacao, bold: true }),
                ]);
            }else{
                equipe_pc = equipe_pc.concat([
                    new TextRun({ text: 'Investigador(es) '}),
                    new TextRun({ text: model.fields.equipes.pc.investigacao, bold: true }),
                   
                ]);
            }    
        }

        if(equipe_pc.length > 0){
            equipe_pc = equipe_pc.concat([
                new TextRun({ text: ' ('}),
                new TextRun({ text: model.fields.equipes.pc.origem }),
                new TextRun({ text: ', VTR Nº'}),
                new TextRun({ text: model.fields.equipes.pc.vtr }),
                new TextRun({ text: ')'})
            ]);

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'itens',
                    bullet: {
                        level: 1,
                    },
                    children: equipe_pc
                }),
            ]);
        }

        retorno.push(
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({ text: 'No momento da chegada da equipe pericial, o local '}),
                    new TextRun({ text: model.getIsolamentoText(), bold: true }),
                    new TextRun(' e '),
                    new TextRun({ text: model.getPreservacaoText(), bold: true }),
                    new TextRun({ text: ((model.fields.local.condicoes.length > 0) ? ', ' + model.fields.local.condicoes : '') }),
                    //new TextRun({ text: ((data.condicoes_cadaver.length > 0) ? ', estando o corpo ' + data.condicoes_cadaver : '') }),
                    new TextRun({ text: '.'}),
                ]
            })
        );
        

        return retorno;

    }

}