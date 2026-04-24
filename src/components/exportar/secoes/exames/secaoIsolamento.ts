import { SecaoSubExames } from './secaoSubExames'; 
import { Paragraph, TextRun} from 'docx';
import { Atendimento, PresenteNoLocal } from 'src/app/models/atendimento.model';

/** Marcador de alínea em minúsculas: a, b, …, z, aa, … (como na perinecroscopia). */
function formatarMarcadorAlinea(indice: number): string {
    let n = indice;
    let out = '';
    while (n > 0) {
        n -= 1;
        out = String.fromCharCode(97 + (n % 26)) + out;
        n = Math.floor(n / 26);
    }
    return out || 'a';
}

function paragrafoPresenteDocx(marcadorAlinea: string, p: PresenteNoLocal): Paragraph {
    const nome = (p.nome || '').trim();
    const cargo = (p.cargo || '').trim();
    const orgao = (p.orgao || '').trim();
    const origem = (p.origem || '').trim();
    const veiculo = (p.veiculo || '').trim();
    const parts: string[] = [];
    if (orgao) {
        parts.push(orgao);
    }
    if (cargo) {
        parts.push(cargo);
    }
    if (origem) {
        parts.push(origem);
    }
    if (veiculo) {
        parts.push('VTR Nº ' + veiculo);
    }
    const inner = parts.length ? parts.join(', ') : '—';
    return new Paragraph({
        style: 'ListParagraph',
        children: [
            new TextRun({ text: marcadorAlinea + (nome || '—'), bold: true }),
            new TextRun({ text: ' (' + inner + ');' }),
        ],
    });
}

function contarItensListaPresentes(model: Atendimento): number {
    const presentesList = model.fields.presentes || [];
    const temPresentesNovos = presentesList.some((p: PresenteNoLocal) =>
        !!(p.nome?.trim() || p.cargo?.trim() || p.origem?.trim() || p.veiculo?.trim())
    );
    if (temPresentesNovos) {
        return presentesList.filter(
            (p: PresenteNoLocal) => !!(p.nome?.trim() || p.cargo?.trim() || p.origem?.trim() || p.veiculo?.trim()),
        ).length;
    }
    let n = 0;
    if (model.fields.equipes.pm.representante.length > 0) {
        n++;
    }
    if (model.fields.equipes.pc.delegado.length > 0 || model.fields.equipes.pc.investigacao.length > 0) {
        n++;
    }
    return n;
}

/** Introdução da lista de presentes: gênero do perito e número de itens. */
function textoIntroPresentesNoLocal(artigo: 'o' | 'a', quantidadeItens: number): string {
    const além =
        artigo === 'o'
            ? 'Além do perito oficial, encontravam-se presentes no local dos fatos, no momento da intervenção pericial, '
            : 'Além da perita oficial, encontravam-se presentes no local dos fatos, no momento da intervenção pericial, ';
    if (quantidadeItens === 1) {
        return (
            além +
            'a seguinte pessoa/equipe, responsável pela preservação e/ou já presente na área:'
        );
    }
    return (
        além +
        'as seguintes pessoas/equipes, responsáveis pela preservação e/ou já presentes na área:'
    );
}

export class SecaoIsolamento extends SecaoSubExames{

    override getTitulo(){
        return 'ISOLAMENTO E PRESERVAÇÃO DO LOCAL';
    }

    override isSecaoDisponivel(){

        let local = this.documento.atendimento.fields.local;

        return (local.isolamento.length > 0) || (local.preservacao.length > 0);
    }

    override async runInternal(): Promise<any[]> {

        let model = this.documento.atendimento;
        const artigo = this.documento.perito.getArtigo() as 'o' | 'a';
        const qPresentes = contarItensListaPresentes(model);
        let indiceAlineaPresentes = 0;
        const proximoMarcadorAlinea = () => {
            indiceAlineaPresentes += 1;
            return formatarMarcadorAlinea(indiceAlineaPresentes) + ') ';
        };

        let retorno = [
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({ text: textoIntroPresentesNoLocal(artigo, qPresentes) })
                ]
            })
        ];

        const presentesList = model.fields.presentes || [];
        const temPresentesNovos = presentesList.some((p: PresenteNoLocal) =>
            !!(p.nome?.trim() || p.cargo?.trim() || p.origem?.trim() || p.veiculo?.trim())
        );

        if (temPresentesNovos) {
            for (const p of presentesList) {
                if (!(p.nome?.trim() || p.cargo?.trim() || p.origem?.trim() || p.veiculo?.trim())) {
                    continue;
                }
                retorno = retorno.concat([paragrafoPresenteDocx(proximoMarcadorAlinea(), p)]);
            }
        } else {

        if(model.fields.equipes.pm.representante.length > 0){

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({ text: proximoMarcadorAlinea() + model.fields.equipes.pm.representante, bold: true }),
                        new TextRun({ text: ' (Polícia Militar, '}),
                        new TextRun({ text: model.fields.equipes.pm.origem }),
                        new TextRun({ text: ', VTR Nº'}),
                        new TextRun({ text: model.fields.equipes.pm.vtr }),
                        new TextRun({ text: ');' }),
                    ],
                }),
            ]);
        }


        let equipe_pc: any[] = [];

        if(model.fields.equipes.pc.delegado.length > 0){

            equipe_pc = [
                new TextRun({ text: 'Delegado '}),
                new TextRun({ text: model.fields.equipes.pc.delegado.toLocaleUpperCase(), bold: true }),
            ];
        }

        if(model.fields.equipes.pc.investigacao.length > 0){

            if(equipe_pc.length > 0){  
                equipe_pc = equipe_pc.concat(new TextRun({ text: ' e '}));
            }

            const investigadores = model.fields.equipes.pc.investigacao.split(',').map((item: string) => item.trim());

            if (investigadores.length > 1) {
                equipe_pc = equipe_pc.concat(new TextRun({ text: 'Investigadores '}));
            } else {
                equipe_pc = equipe_pc.concat(new TextRun({ text: 'Investigador '}));
            }

            investigadores.forEach((investigador: string, index: number) => {
                equipe_pc = equipe_pc.concat([
                    new TextRun({ text: (index > 0) ? ((index < investigadores.length - 2) ? ', ' : ' e ') : '' }),
                    new TextRun({ text: investigador.toLocaleUpperCase(), bold: true }),
                ]);
            }); 
        }

        if(equipe_pc.length > 0){
            equipe_pc = equipe_pc.concat([
                new TextRun({ text: ' ('}),
                new TextRun({ text: model.fields.equipes.pc.origem })
            ]);

            if (model.fields.equipes.pc.vtr.length > 0) {
                equipe_pc = equipe_pc.concat([
                    new TextRun({ text: ', VTR Nº'}),
                    new TextRun({ text: model.fields.equipes.pc.vtr }),
                    new TextRun({ text: ')' })
                ]);
            }

            equipe_pc = equipe_pc.concat(new TextRun({ text: ';'}));

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'ListParagraph',
                    children: [
                        new TextRun({ text: proximoMarcadorAlinea() }),
                        ...equipe_pc,
                    ],
                }),
            ]);
        }

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