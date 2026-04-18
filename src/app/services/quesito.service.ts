import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  updateDoc,
  type DocumentReference,
} from 'firebase/firestore';
import { Quesito } from '../models/quesito.model';

/** Se existir `quesitos/catalog`, usa-o; senão o único documento da coleção (sem criar novos). */
const CATALOGO_DOC_ID = 'catalog';

@Injectable({
  providedIn: 'root'
})
export class QuesitoService {

  catalogoPerguntas: string[] = [...Quesito.perguntasPadrao];
  catalogoRespostas: string[] = [...Quesito.respostasPadrao];

  constructor(private firestore: Firestore) {}

  /**
   * Lê o catálogo: primeiro `quesitos/catalog`, senão qualquer documento existente (legado).
   * Campos: `perguntas` e `respostas` (arrays de string).
   */
  async loadCatalogo(): Promise<void> {
    try {
      const fixedRef = doc(this.firestore, 'quesitos', CATALOGO_DOC_ID);
      const fixedSnap = await getDoc(fixedRef);
      let data = fixedSnap.exists() ? fixedSnap.data() : undefined;
      if (data === undefined) {
        const q = query(collection(this.firestore, 'quesitos'), limit(1));
        const qs = await getDocs(q);
        if (!qs.empty) {
          data = qs.docs[0].data();
        }
      }
      if (data === undefined) {
        return;
      }
      const perguntas = data['perguntas'];
      const respostas = data['respostas'];
      if (Array.isArray(perguntas) && perguntas.length > 0) {
        this.catalogoPerguntas = perguntas.filter((x): x is string => typeof x === 'string');
      }
      if (Array.isArray(respostas) && respostas.length > 0) {
        this.catalogoRespostas = respostas.filter((x): x is string => typeof x === 'string');
      }
    } catch (e) {
      console.error('QuesitoService.loadCatalogo', e);
    }
  }

  /**
   * Referência ao único documento existente em `quesitos`, ou null se a coleção estiver vazia.
   */
  private async resolveExistingCatalogDocRef(): Promise<DocumentReference | null> {
    const fixedRef = doc(this.firestore, 'quesitos', CATALOGO_DOC_ID);
    const fixedSnap = await getDoc(fixedRef);
    if (fixedSnap.exists()) {
      return fixedRef;
    }
    const qs = await getDocs(query(collection(this.firestore, 'quesitos'), limit(1)));
    if (!qs.empty) {
      return qs.docs[0].ref;
    }
    return null;
  }

  /**
   * Acrescenta pergunta e resposta ao único documento em `quesitos`, sem duplicar (`arrayUnion`).
   * Não cria documentos; se não existir registro, não faz nada.
   */
  async appendCatalogoEntries(pergunta: string, resposta: string): Promise<void> {
    const p = (pergunta ?? '').trim();
    const r = (resposta ?? '').trim();
    if (!p && !r) {
      return;
    }

    const ref = await this.resolveExistingCatalogDocRef();
    if (!ref) {
      console.warn('QuesitoService.appendCatalogoEntries: nenhum documento em quesitos para atualizar.');
      return;
    }

    const payload: {
      perguntas?: ReturnType<typeof arrayUnion>;
      respostas?: ReturnType<typeof arrayUnion>;
    } = {};
    if (p) {
      payload.perguntas = arrayUnion(p);
    }
    if (r) {
      payload.respostas = arrayUnion(r);
    }
    await updateDoc(ref, payload);

    if (p && !this.catalogoPerguntas.includes(p)) {
      this.catalogoPerguntas = [...this.catalogoPerguntas, p];
    }
    if (r && !this.catalogoRespostas.includes(r)) {
      this.catalogoRespostas = [...this.catalogoRespostas, r];
    }
  }
}
