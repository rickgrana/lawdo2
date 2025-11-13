import { Secao } from '../../secao'; 
import { Paragraph, TextRun} from 'docx';
import { Vitima } from 'src/app/models/vitima.model';
import { NumberHelper } from 'src/extensions/numberHelper';

export class SecaoPerinecroVitima extends Secao{

    private vitima: Vitima;
    
    setVitima(vitima: Vitima){
        this.vitima = vitima;

        return this;
    }

    getVitima(){
        return this.vitima;
    }

    async runInternal(){

        let retorno = [];

        let model = this.documento.atendimento;
    
        retorno = retorno.concat([
            new Paragraph ({
                style: 'padrao',
                children: [
                    new TextRun({
                        text: 'A partir da observação dos elementos presentes no local de crime, ' +
                            'em relação à '
                    }),

                    new TextRun({
                        text: this.getVitima().index,
                        bold: true
                    }),

                    new TextRun({
                        text: ', constatou o perit' + this.documento.perito.getArtigo() + ':'
                    })
                ]
            })
        ]);


        const ferimentos = await this.getParagrafoFerimentos();

        if(ferimentos.length > 0){

            retorno = retorno.concat([
                new Paragraph ({
                    style: 'itens',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: 'A presença de ferimento(s) produzido(s) por instrumento perfuro-contundente e compatíveis aos produzidos por projéteis de arma de fogo curta, nas seguintes quantidades e regiões:',
                        }),
                    ],
                })
            ]);

            
            for(const ferimento of ferimentos){
                retorno = retorno.concat(ferimento);
            }
        }

        if(this.documento.atendimento.isSuicidio){
            retorno = retorno.concat([
                new Paragraph ({
                    style: 'itens',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: 'A presença na VÍTIMA de sulco único ascendente e oblíquo na região do pescoço, com borda superior mais alta que a inferior, com interrupção na parte posterior da cabeça;',
                        }),
                    ],
                })
            ]);
        }

        // PERTENCES DA VITIMA
        if(this.vitima.pertences.length > 0){

            if(this.vitima.pertences.trim().toUpperCase() == 'NADA'){
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A AUSÊNCIA de PERTENCES com a vítima;',
                            }),
                        ],
                    })
                ]);
            }else{

                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença dos seguintes PERTENCES com a vítima:',
                            }),
                        ],
                    })
                ]);

                this.vitima.pertences.split(",").forEach((pertence) => {
                    retorno = retorno.concat([
                        new Paragraph ({
                            style: 'itens',
                            bullet: {
                                level: 1,
                            },
                            children: [
                                new TextRun({
                                    text: pertence.trim().toUpperCase()
                                }),
                                new TextRun(';')
                            ],
                        }),
                    ]);
                });
            }
        }


        // TATUAGENS DA VITIMA
        if(this.vitima.tatuagens.length > 0){

            const qtde = this.vitima.tatuagens.split(",").length;

            if(qtde == 1){
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença de TATUAGEM ' + this.vitima.tatuagens,
                            }),
                        ],
                    })
                ]);
            }else{

                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: 'A presença de TATUAGEM nas seguintes regiões:'
                            }),
                        ],
                    })
                ]);
             
                this.vitima.tatuagens.split(",").forEach((tatoo) => {
                    retorno = retorno.concat([
                        new Paragraph ({
                            style: 'itens',
                            bullet: {
                                level: 1,
                            },
                            children: [
                                new TextRun({
                                    text: tatoo.trim().toUpperCase()
                                }),
                                new TextRun(';')
                            ],
                        }),
                    ]);
                });
            }
        }


        // OBSERVAÇÕES DA VITIMA
        if(this.vitima.observacoes.length > 0){

            this.vitima.observacoes.split(";").forEach((item) => {
                retorno = retorno.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 0,
                        },
                        children: [
                            new TextRun({
                                text: item.trim()
                            }),
                            new TextRun(';')
                        ],
                    }),
                ]);
            });
        }
        

        return retorno;

    }

    async getParagrafoFerimentos() {

        let secoes = [];
    
        var pafs_frente = new Map();
        var pafs_costas = new Map();
        var qtde = 0;
    
        // Conta qtde de PAFs por regiao
        for(const regiao of this.vitima.paf_frente.split(",")){
            
            if (pafs_frente.has(regiao.trim())) {
                qtde = pafs_frente.get(regiao.trim());
            } else {
                qtde = 0;
            }
    
            pafs_frente.set(regiao.trim(), qtde + 1);
        }
    
        for(const regiao of this.vitima.paf_costas.split(",")){
       
            if (pafs_costas.has(regiao.trim())) {
                qtde = pafs_costas.get(regiao.trim());
            } else {
                qtde = 0;
            }
    
            pafs_costas.set(regiao.trim(), qtde + 1);
        }
    
    
        const regioes_frontal = new Map([
            ['1' , 'Frontal'],
            ['2E' , 'Orbitária Esquerda'],
            ['2D' , 'Orbitária Direita'],
            ['3' , 'Nasal'],
            ['4E' , 'Malar Esquerda'],
            ['4D' , 'Malar Direita'],
            ['5E' , 'Masseterina Esquerda'],
            ['5D' , 'Masseterina Direita'],
            ['6E' , 'Bucinadora Esquerda'],
            ['6D' , 'Bucinadora Direita'],
            ['7' , 'Labial'],
            ['8' , 'Mentoniana'],
            ['9' , 'Supra-Hióidea'],
            ['10' , 'Infra-Hióidea'],
            ['11E' , 'Carotidiana Esquerda'],
            ['11D' , 'Carotidiana Direita'],
            ['12E' , 'Supraclavicular Esquerda'],
            ['12D' , 'Supraclavicular Direita'],
            ['13E' , 'Clavicular Esquerda'],
            ['13D' , 'Clavicular Direita'],
            ['14E' , 'Infraclavicular Esquerda'],
            ['14D' , 'Infraclavicular Direita'],
            ['15', 'Esternal'],
            ['16E', 'Torácica Esquerda'],
            ['16D', 'Torácica Direita'],
            ['17E', 'Mamária Esquerda'],
            ['17D', 'Mamária Direita'],
            ['18', 'Epigástrica'],
            ['19E', 'Hipocôndrica Esquerda'],
            ['19D', 'Hipocôndrica Direita'],
            ['20', 'Mesogástrica'],
            ['21', 'Umbilical'],
            ['22E', 'Flanco Esquerdo'],
            ['22D', 'Flanco Direito'],
            ['23', 'Hipogástrica'],
            ['24E', 'Fossa Ilíaca Esquerda'],
            ['24D', 'Fossa Ilíaca Direita'],
            ['25', 'Pubiana'],
            ['26D', 'Inguina Direita'],
            ['26E', 'Inguina Esquerda'],
            ['27D', 'Crural Direita'],
            ['27E', 'Crural Esquerda'],
            ['28', 'Penianna'],
            ['29', 'Escrotal'],
            ['30D', 'do TERÇO SUPERIOR do BRAÇO DIREITO'],
            ['30E', 'do TERÇO SUPERIOR do BRAÇO ESQUERDO'],

            ['31E', 'do TERÇO MÉDIO do BRAÇO ESQUERDO'],
            ['31D', 'do TERÇO MÉDIO do BRAÇO DIREITO'],
            ['32E', 'do TERÇO INFERIOR do BRAÇO ESQUERDO'],
            ['32D', 'do TERÇO INFERIOR do BRAÇO DIREITO'],
            ['33E', 'das PREGRAS do COTOVELO ESQUERDO'],
            ['33D', 'das PREGRAS do COTOVELO DIREITO'],
            ['34E', 'do Terço superior do antebraço esquerdo'],
            ['34D', 'do Terço superior do antebraço direito'],
            ['35E', 'do Terço médio do antebraço esquerdo'],
            ['35D', 'do Terço médio do antebraço direito'],
            ['30E', 'do Terço superior do braço esquerdo'],
            ['38E', 'Côncava da Mão Esquerda']
        ]);
    
        const regioes_costas = new Map([
            ['1' , 'Parietal'],
            ['1E' , 'Parietal Esquerda'],
            ['1D', 'Parietal Direita'],
            ['2' , 'Occipital'],
            ['3' , 'Temporal'],
            ['4' , 'Nuca'],
            ['5', 'Vertebral'],
            ['6E', 'Escapular Esquerda'],
            ['6D', 'Escapular Direita'],
            ['7E', 'Infra-escapular Esquerda'],
            ['7D', 'Infra-escapular Direita'],
            ['8E', 'Lombar Esquerda'],
            ['8D', 'Lombar Direita'],
            ['9E', 'Lateral Esquerda do Abdomem'],
            ['9D', 'Lateral Direita do Abdomem'],
            ['10', 'Sacral'],
            ['11', 'Glútea'],
            ['11E', 'Glútea Esquerda'],
            ['11D', 'Glútea Direita'],
            ['21E', 'Deltóidea Esquerda'],
            ['21D', 'Deltóidea Direita'],
            ['22E', 'do TERÇO PROXIMAL da parte POSTERIOR do BRAÇO ESQUERDO'],
            ['22D', 'do TERÇO PROXIMAL da parte POSTERIOR do BRAÇO DIREITO'],
        ]);
    
        var regiao_traduzida= '';
    
    
        // exibe os registros por região (FRENTE)
       
        for await(let [regiao, qtde] of pafs_frente){
        
            regiao_traduzida = regioes_frontal.get(regiao.trim());

            if(regiao_traduzida) {
    
                secoes = secoes.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 1,
                        },
                        children: [
                            new TextRun({
                                text: qtde.toString().padStart(2, '0') + 
                                ' (' + NumberHelper.getExtenso(qtde, 'F') + ')' + 
                                ' perfuraç' + ((qtde > 1) ? 'ões' : 'ão') + ' na região '
                            }),
                            new TextRun({ text: regiao_traduzida.toUpperCase(), bold: true }),
                            new TextRun(';')
                        ],
                    }),
                ]);
            }
        }
    
        // exibe os registros por região (COSTAS)
        for await(let [regiao, qtde] of pafs_costas){
       
            regiao_traduzida = regioes_costas.get(regiao.trim());
    
            if(regiao_traduzida) {
    
                secoes = secoes.concat([
                    new Paragraph ({
                        style: 'itens',
                        bullet: {
                            level: 1,
                        },
                        children: [
                            new TextRun({
                                text: qtde.toString().padStart(2, '0') + 
                                ' (' + NumberHelper.getExtenso(qtde, 'F') + ')' + 
                                ' perfuraç' + ((qtde > 1) ? 'ões' : 'ão') + ' na região '
                            }),
                            new TextRun({ text: regiao_traduzida.toUpperCase(), bold: true }),
                            new TextRun(';')
                        ],
                    }),
                ]);
            }
        }
    
        if(secoes.length > 0){
            secoes = secoes.concat([
                new Paragraph ('')
            ]);
        }
        
    
        /*const lesoes = new Map();
        let qtde = 0;
    
        for (let item of data.ferimentos.cabeca_anterior.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
    
        for (let item of data.ferimentos.cabeca_posterior.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
        
        for (let item of data.ferimentos.cabeca_lateral.items) {
            if (lesoes.has(item.regiao)) {
                qtde = lesoes.get(item.regiao);
            } else {
                qtde = 0;
            }
    
            lesoes.set(item.regiao, qtde + 1);
        }
    
        lesoes.forEach((qtde, regiao) => {
    
    
            secoes = secoes.concat([
                new Paragraph ({
                    style: 'padrao',
                    bullet: {
                        level: 0,
                    },
                    children: [
                        new TextRun({
                            text: qtde.toString().padStart(2, '0') + 
                            ' (' + NumberHelper.getExtenso(qtde) + ')' + 
                            ' perfuraç' + ((qtde > 1) ? 'ões' : 'ão') + ' na região '
                        }),
                        new TextRun({ text: regiao.toUpperCase(), bold: true }),
                        new TextRun(';')
                    ],
                }),
            ]);
        });*/
    
        return secoes;
      }

}