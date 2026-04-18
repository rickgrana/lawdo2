import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class DelegadoService {

  /** Nomes carregados da coleção `delegados` (campo `nome` em cada documento). */
  nomes: string[] = [];

  constructor(private firestore: Firestore) {}

  async loadNomes(): Promise<void> {
    try {
      const snap = await getDocs(collection(this.firestore, 'delegados'));
      const seen = new Set<string>();
      const list: string[] = [];
      for (const d of snap.docs) {
        const nome = d.data()['nome'];
        if (typeof nome === 'string') {
          const n = nome.trim();
          if (n && !seen.has(n.toLowerCase())) {
            seen.add(n.toLowerCase());
            list.push(n);
          }
        }
      }
      this.nomes = list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    } catch (e) {
      console.error('DelegadoService.loadNomes', e);
    }
  }

  /** Considera duplicata em maiúsculas/minúsculas. */
  private nomeJaExiste(nome: string): boolean {
    const n = (nome ?? '').trim();
    if (!n) {
      return false;
    }
    const lower = n.toLowerCase();
    return this.nomes.some(x => x.toLowerCase() === lower);
  }

  /**
   * Se o nome não existir na coleção (ignorando maiúsculas), adiciona um documento `{ nome }`.
   */
  async ensureDelegado(nome: string): Promise<void> {
    const n = (nome ?? '').trim();
    if (!n) {
      return;
    }
    if (this.nomeJaExiste(n)) {
      return;
    }

    await addDoc(collection(this.firestore, 'delegados'), { nome: n });
    this.nomes = [...this.nomes, n].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }
}
