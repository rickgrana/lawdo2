import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { PresenteNoLocal } from '../models/atendimento.model';

function norm(s: string): string {
  return (s ?? '').trim().toLowerCase();
}

function isCargoDelegado(cargo: string): boolean {
  const c = norm(cargo);
  return c === 'delegado' || c === 'delegada' || c === 'delegados' || c === 'delegadas';
}

function isCargoInvestigador(cargo: string): boolean {
  const c = norm(cargo);
  return (
    c === 'investigador' ||
    c === 'investigadora' ||
    c === 'investigadores' ||
    c === 'investigadoras'
  );
}

@Injectable({
  providedIn: 'root'
})
export class PreservacaoService {

  private static readonly CATALOGO_DOC_ID = 'default';

  constructor(private firestore: Firestore) {}

  /**
   * Mescla dados dos presentes no documento único em `preservacao` (sugestões reutilizáveis).
   */
  async mergeCatalogoComPresentes(presentes: PresenteNoLocal[]): Promise<void> {
    const ORG_PC = 'Polícia Civil';
    const ORG_IML = 'IML';

    const delegados: string[] = [];
    const investigadores: string[] = [];
    const iml: string[] = [];
    const origens: string[] = [];
    const veiculos: string[] = [];

    for (const p of presentes) {
      const nome = (p.nome ?? '').trim();
      if (!nome) {
        continue;
      }

      const orgao = (p.orgao ?? '').trim();
      const cargo = p.cargo ?? '';
      const origem = (p.origem ?? '').trim();
      const veiculo = (p.veiculo ?? '').trim();

      if (orgao === ORG_IML) {
        iml.push(nome);
      }
      if (isCargoDelegado(cargo)) {
        delegados.push(nome);
      }
      if (isCargoInvestigador(cargo)) {
        investigadores.push(nome);
      }
      if ((orgao === ORG_PC || orgao === ORG_IML) && veiculo.length) {
        veiculos.push(veiculo);
      }
      if (origem.length) {
        origens.push(origem);
      }
    }

    const ref = doc(this.firestore, 'preservacao', PreservacaoService.CATALOGO_DOC_ID);
    const payload: Record<string, ReturnType<typeof arrayUnion>> = {};
    if (delegados.length) {
      payload['delegados'] = arrayUnion(...delegados);
    }
    if (investigadores.length) {
      payload['investigadores'] = arrayUnion(...investigadores);
    }
    if (iml.length) {
      payload['iml'] = arrayUnion(...iml);
    }
    if (origens.length) {
      payload['origens'] = arrayUnion(...origens);
    }
    if (veiculos.length) {
      payload['veiculos'] = arrayUnion(...veiculos);
    }

    if (!Object.keys(payload).length) {
      return;
    }

    await setDoc(ref, payload, { merge: true });
  }
}
