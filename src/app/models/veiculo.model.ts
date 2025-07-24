import { Base } from "./base.model";

export class Veiculo extends Base {

    index = ''; // apenas para exportacao

    placa   =   '';
    tracao  =   '';
    tipo    =   '';
    especie = '';
    carroceria = '';
    marca   = 'Não reconhecida';
    modelo  = '';
    ano     = '';

    chassi  = '';
    cor     = '';
    categoria = '';


    apresentacao = {
        responsavel: '',
        doc_responsavel: '',
        local: ''
    };

    avarias: [] = [];

    static override loadFrom(record: any){
        const model = new Veiculo();
        model.isNew = false;
        model.load(record);

        return model;
    }


    override load(data: any) {

        this.isNew = false;

        this.placa                   = this.getValue(data.placa);
        this.tracao                   = this.getValue(data.tracao);
        this.tipo                   = this.getValue(data.tipo);
        this.especie                   = this.getValue(data.especie);
        this.carroceria                   = this.getValue(data.carroceria);
        this.marca                   = this.getValue(data.marca);
        this.modelo                   = this.getValue(data.modelo);
        this.ano                   = this.getValue(data.ano);
        this.chassi                   = this.getValue(data.chassi);
        this.cor                   = this.getValue(data.cor);
        this.categoria                   = this.getValue(data.categoria);
        this.apresentacao          = this.getValue(data.apresentacao);


        if (data.avarias) {

            /*data.avarias.forEach((item) => {
                const vestigio = new Vestigio();
                vestigio.load(item);
            });*/
        }

    }

    get tracoes(){
        return Array(
            'Automotor',
            'Elétrico',
            'De propulsão humana',
            'De tração animal',
            'Reboque',
            'semi-reboque'
        );
    }

    get especies(){
        return Array(
            'Passageiro',
            'Carga',
            'Misto',
            'Competição',
            'Especial',
            'Tração'
        );
    }

    get tipos(){
        return Array(
            'Automóvel',
            'Motocicleta',
            'Ciclomotor',
            'Motoneta',
            'Triciclo',
            'Micro-Ônibus',
            'Ônibus',
            'Reboque',
            'Semirreboque',
            'Camioneta',
            'Caminhão',
            'Caminhão Trator',
            'Quadriciclo',
            'Chassi Plataforma',
            'Tração sobre Rodas',
            'Tração sobre Esteiras',
            'Tração Mista',
            'Bonde',
            'Charrete'
        );
    }


    static get carrocerias() {
        return Array(
            'Nenhuma',
            'Viatura',
            'SideCar',
            'Ambulância',
            'Bombeiro',
            'Carroceria Aberta',
            'Carroceria Fechada',
            'Basculante',
            'Funeral',
            'Limusine',
            'Transporte de Presos',
            'Comércio',
            'Transporte Escolar',
            'Transporte Recreativo',
            'Transporte de Trabalhadores',
            'Transporte de Valores',
            'Transporte Militar',
            'Chassi Contêiner',
            'Prancha',
            'Silo',
            'Tanque',
            'Intercambiável',
            'Roll-on Roll-off',
            'Transporte de Toras',
            'Transporte de Granito',
            'Tanque de Produto Perigoso',
            'Trailler',
            'Trio Elétrico',
            'Dolly',
            'Comboio',
            'Furgão',
            'Som',
            'Jipe',

        );
    }

    get categorias() {
        return Array(
            'Particular',
            'Oficial',
            'Aluguel',
            'Uso Diplomático',
            'Aprendizagem'
        );
    }


    get marcas() {
        return Array(
            'Audi',
            'Bentley',
            'BMW',
            'CHERY',
            'Changan',
            'Chevrolet',
            'Chrysler',
            'Citroen',
            'Dodge',
            'Ferrari',
            'Fiat',
            'Ford',
            'Foton',
            'Honda',
            'Hyundai',
            'Iveco',
            'JAC',
            'Jaguar',
            'Jeep',
            'Jinbei',
            'Kia',
            'Lamborghini',
            'Land Rover',
            'Lexus',
            'Maserati',
            'Mercedes-AMG',
            'Mercedes-Benz',
            'Mini',
            'Mitsubishi',
            'Nissan',
            'Peugeout',
            'Porsche',
            'RAM',
            'Rely',
            'Renault',
            'Rolls-Royce',
            'SsangYong',
            'Subaru',
            'Suzuki',
            'TAC',
            'Tesla',
            'Toyota',
            'Troller',
            'Volkswagen',
            'Volvo'
        );
    }

    override rawData() {
        let retorno = {
            placa: this.placa,
            tracao: this.tracao,
            tipo: this.tipo,
            especie: this.especie,
            carroceria: this.carroceria,
            marca: this.marca,
            modelo: this.modelo,
            ano: this.ano,
            chassi: this.chassi,
            cor: this.cor,
            categoria: this.categoria,
            apresentacao: this.apresentacao
          };

          return retorno;
    }


}
