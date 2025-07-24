import { Base } from "./base.model";

export class Quesito extends Base {
    pergunta    = '';
    resposta    = '';

    static override loadFrom(record: any){
        const model = new Quesito();
        model.isNew = false;
        model.pergunta = record.pergunta;
        model.resposta = record.resposta;

        return model;
    }

    override rawData() {
        return {
            pergunta: this.pergunta,
            resposta: this.resposta
        };
    }

    static get perguntasPadrao() {
        return Array(
            'Descrever como a vítima foi encontrada',
            'Qual (is) a(s) arma(s) utilizadas no crime? Quais suas características?',
            'Quantas perfurações atingiram a(s) vítima(s)?',
            'Quantos disparos atingiram a(s) vítima(s)?',
            'A dinâmica do crime',
            'Outros que os peritos entenderem necessários ou relacionados ao fato',
            'Há vestígios de violência no local? Em que consistem esses vestígios?',
            'A vítima apresenta lesões características de defesa?',
            'Há como definir a hora aproximada da morte?',
            'Descrever a provável dinâmica do evento',
            'Houve destruição, inutilização ou deterioração da coisa submetida a exame?',
            'Qual o o meio e quais os instrumentos empregados?',
            'Houve emprego de substância inflamável ou explosiva?',
            'Qual o valor do dano causado?',
            'Outros questionamentos que achar pertinentes'
        );
    }

    static get respostasPadrao() {
        return Array(
            'SIM',
            'NÃO',
            'Nada a acrescentar no momento',
            'Vide Laudo com um todo',
            'Vide seção II',
            'Vide seção "POSSÍVEL DINÂMICA DO EVENTO"',
            //'Vide seção "FERIMENTOS"',
            'Vide seção "CADÁVER"',
            'Vide seção "PERINECROSCOPIA"',
            'Este Instituto não possui setor de Merceologia para responder ao referido quesito'
        );
    }
}
