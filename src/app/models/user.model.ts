import { Corporacao } from '../models/corporacao.model';
import { Orgao } from '../models/orgao.model';

export class UserFields {
    uid: string = '';
    email: string = '';
    photoURL?: string;
    displayName?: string;
    favoriteColor?: string;
    nomeCompleto?: string;
    sexo?: string;
    matricula?: string;
    parcerias?: string[];
    uf?: string;
    corporacao?: string;
    unidade?: string;
    superior?: string;
    parceriaAuthCode?: string;
    parceriaAuthDate?: any;

    rawData(){
        return {
          uid: this.uid,
          email: this.email,
          photoURL: this.photoURL,
          displayName: this.displayName,
          favoriteColor: this.favoriteColor,
          nomeCompleto: this.nomeCompleto,
          sexo: this.sexo,
          matricula: this.matricula,
          parcerias: this.parcerias,
          uf: this.uf,
          corporacao: this.corporacao,
          unidade: this.unidade,
          superior: this.superior,
          parceriaAuthCode: this.parceriaAuthCode,
          parceriaAuthDate: this.parceriaAuthDate
        };
    }
}

export class User {
  uid: string = '';
  ref: string = '';
  fields: UserFields;
  corporacao?: Corporacao;
  orgao?: Orgao;

  constructor(){
      this.fields = new UserFields;
  }

  static loadFromStorage(data: any){

      let user = new User;

      user.uid = data.uid;
      user.ref = data.ref;

      /*user.fields.photoURL       = data.photoURL;
      user.fields.displayName       = data.displayName;
      user.fields.favoriteColor       = data.favoriteColor;
      user.fields.nomeCompleto       = data.nomeCompleto;
      user.fields.sexo                = data.sexo;
      user.fields.matricula               = data.matricula;
      user.fields.parcerias               = data.parcerias;
      user.fields.uf                      = data.uf;
      user.fields.corporacao              = data.corporacao;
      user.fields.unidade                 = data.unidade;
      user.fields.superior                = data.superior;
      user.fields.parceriaAuthCode       = data.parceriaAuthCode;
      user.fields.parceriaAuthDate       = data.parceriaAuthDate;*/

      user.fields = data.fields;

      if(data.corporacao){
          user.corporacao = Corporacao.loadFrom(data.corporacao);
      }

      if(data.orgao){
          user.orgao = Orgao.loadFrom(data.orgao);
      }

      return user;
  }

  static loadFromGmail(data: any){
      let user = new User;

      user.uid = data.uid;
      user.fields.email           = data.email;
      user.fields.photoURL       = data.photoURL;
      user.fields.displayName       = data.displayName;
      user.fields.favoriteColor       = data.favoriteColor;

      return user;
  }

  static loadFromDb(ref: any, data: any){
      let user = new User;

      user.uid = data.uid;
      user.ref = ref;

      user.fields.email           = data.email;
      user.fields.photoURL       = data.photoURL;
      user.fields.displayName       = data.displayName;
      user.fields.favoriteColor       = data.favoriteColor;
      user.fields.nomeCompleto       = data.nomeCompleto;
      user.fields.sexo                = data.sexo;
      user.fields.matricula               = data.matricula;
      user.fields.parcerias               = data.parcerias;
      user.fields.uf                      = data.uf;
      user.fields.corporacao              = data.corporacao;
      user.fields.unidade                 = data.unidade;
      user.fields.superior                = data.superior;
      user.fields.parceriaAuthCode       = data.parceriaAuthCode;
      user.fields.parceriaAuthDate       = data.parceriaAuthDate;

      return user;
  }

  rawData(){
    return this.fields.rawData();
  }
}
