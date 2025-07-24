export class Cabelo {

    tipo    = '';
    cor     = '';
    comprimento = '';

    get tipos() {
        return  Array(
            'Lisos',
            'Ondulados',
            'Encaracolados',
            'Crespos',
            'Sem Cabelos',
            'Raspados'
        );
    }

    get cores() {
        return  Array(
            'Castanhos',
            'Pretos',
            'Loiros',
            'Ruivos',
            'Grisalhos',
            'TIngidos',
            'Outros'
        );
    }

    get comprimentos() {
        return Array(
            'Curtos',
            'Médios',
            'Longos',
            'Raspados'
        );
    }


}
