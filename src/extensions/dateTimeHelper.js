
export class DateTimeHelper {

  static strToDate(data){

    if(data === null) return null;

    const dataArray = data.substr(0,10).split('-'); // data em formato ano-mes-dia
    const ano = parseInt(dataArray[0]);
    const mes = parseInt(dataArray[1])-1;
    const dia = parseInt(dataArray[2]);

    return new Date(ano, mes, dia);
  }

  static strToDateTime(data, hora){
    if(data === null) return null;

    const dataArray = data.substr(0,10).split('-'); // data em formato ano-mes-dia
    const horaArray = hora.split(':');

    return new Date(dataArray[0], dataArray[1], dataArray[2], horaArray[0], horaArray[1]);
  }


  static dateToYMD(data) {
    if(data === null) return null;
    return data.getFullYear() + '-' + (data.getMonth() + 1).toString().padStart(2,'0') +  '-' + data.getDate();
  }

  static dateToDMY(data) {
    if(data === null) return null;
    return data.getDate().toString().padStart(2, '0') + '/' + (data.getMonth() + 1).toString().padStart(2,'0')  + '/' + data.getFullYear();
  }

  static dmyToDate(data){
    if(data === null) return null;
    const dataArray = data.substr(0,10).split('/'); // data em formato ano-mes-dia
    const ano = parseInt(dataArray[2]);
    const mes = parseInt(dataArray[1])-1;
    const dia = parseInt(dataArray[0]);

    return new Date(ano, mes, dia);
  }

  static getMesExtenso(mes) {
    switch (mes) {
      case "01":
        return "janeiro"; break;
      case "02":
        return "fevereiro"; break;
      case "03":
        return "março"; break;
      case "04":
        return "abril"; break;
      case "05":
        return "maio"; break;
      case "06":
        return "junho"; break;
      case "07":
        return "julho"; break;
      case "08":
        return "agosto"; break;
      case "09":
        return "setembro"; break;
      case "10":
        return "outubro"; break;
      case "11":
        return "novembro"; break;
      case "12":
        return "dezembro"; break;
    }
  }


  static getDiaExtenso(dia) {
    switch (dia) {
        case "01": return "um"; break;
        case "02":
          return "dois"; break;
        case "03":
          return "três"; break;
        case "04":
          return "quatro"; break;
        case "05":
          return "cinco"; break;
        case "06":
          return "seis"; break;
        case "07":
          return "sete"; break;
        case "08":
          return "oito"; break;
        case "09":
          return "nove"; break;
        case "10":
          return "dez"; break;
        case "11":
          return "onze"; break;
        case "12":
          return "doze"; break;
        case "13":
          return "treze"; break;
        case "14":
          return "quatorze"; break;
        case "15":
          return "quinze"; break;
        case "16":
          return "dezesseis"; break;
        case "17":
          return "dezessete"; break;
        case "18":
          return "dezoito"; break;
        case "19":
          return "dezenove"; break;
        case "20":
          return "vinte"; break;
        case "21":
          return "vinte e um"; break;
        case "22":
          return "vinte e dois"; break;
        case "23":
          return "vinte e três"; break;
        case "24":
          return "vinte e quatro"; break;
        case "25":
          return "vinte e cinco"; break;
        case "26":
          return "vinte e seis"; break;
        case "27":
          return "vinte e sete"; break;
        case "28":
          return "vinte e oito"; break;
        case "29":
          return "vinte e nove"; break;
        case "30":
          return "trinta"; break;
        case "31":
          return "trinta e um"; break;
      }
  }
}