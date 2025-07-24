
export class NumberHelper {
  
  static getExtenso(num, genero = 'M') { // extenso até 99

    const unidades = [
      'zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
      'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte' 
    ];

    if(genero == 'F') {
      unidades[1] = 'uma';
      unidades[2] = 'duas';
    }

    if ((num) <=20){
      return unidades[num];
    }


    const dezenas = [
      'zero', 'dez',  'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'
    ];

    const dezena = Math.floor(num/10);
    const unidade = num - (dezena * 10);

    return dezenas[dezena] + ' e ' + unidades[unidade];
  }

  static getRomano(numero){
    switch(numero){
      case 1: return 'I'; break;
      case 2: return 'II'; break;
      case 3: return 'III'; break;
      case 4: return 'IV'; break;
      case 5: return 'V'; break;
      case 6: return 'VI'; break;
      case 7: return 'VII'; break;
      case 8: return 'VIII'; break;
      case 9: return 'IX'; break;
      case 10: return 'X'; break;
      default: return '0';
    }
  }
}