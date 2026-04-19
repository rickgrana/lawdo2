/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import {google} from "googleapis";

setGlobalOptions({maxInstances: 10});

/** Planilha SISREX — aba `ocorrencias`, coluna I = PROTOCOLO */
const SISREX_SPREADSHEET_ID =
  "1WDF8NBFFSLnqgGFIsi5fd7hEtKOGre0n8TB6rvj2e3Y";

/** Planilha legada (Registro) */
const REGISTRO_SPREADSHEET_ID = "1mzD83_cYq7J3brVK_9dOZWwwqbZgE7WntFi8ekRSJQs";

/** Intervalo largo para incluir todas as colunas futuras da aba */
const SISREX_RANGE = "'ocorrencias'!A:ZZ";

/**
 * Retorna o texto da célula na coluna indicada, ou null se vazio.
 * @param {string[]} row Linha da planilha.
 * @param {number} index Índice da coluna (0 = A).
 * @return {string|null} Valor trimado ou null.
 */
function cell(row: string[], index: number): string | null {
  const v = row[index];
  if (v === undefined || v === null) {
    return null;
  }
  const s = String(v).trim();
  return s === "" ? null : s;
}

/**
 * Normaliza rótulo de cabeçalho para comparação entre colunas.
 * @param {string} s Texto original do cabeçalho.
 * @return {string} Texto em minúsculas com espaços colapsados.
 */
function normalizeHeaderLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Índice da primeira coluna cujo cabeçalho coincide com algum rótulo.
 * @param {string[]} headers Primeira linha da planilha (cabeçalhos).
 * @param {string[]} labels Nomes aceitos para a coluna (ex.: protocolo).
 * @return {number} Índice da coluna, ou -1 se não encontrar.
 */
function findHeaderIndex(headers: string[], labels: string[]): number {
  const targets = labels.map(normalizeHeaderLabel);
  for (let i = 0; i < headers.length; i++) {
    const label = normalizeHeaderLabel(headers[i] ?? "");
    if (targets.includes(label)) {
      return i;
    }
  }
  return -1;
}

/**
 * Gera chaves JSON únicas quando o cabeçalho se repete na planilha.
 * @param {string[]} headers Textos da primeira linha (uma por coluna).
 * @return {string[]} Mesma quantidade de chaves, duplicatas com sufixo (2).
 */
function uniqueHeaderKeys(headers: string[]): string[] {
  const counts = new Map<string, number>();
  return headers.map((raw, i) => {
    let base = raw.trim();
    if (!base) {
      base = `_COL_${i}`;
    }
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}

/**
 * Converte uma linha da planilha em objeto usando as chaves do cabeçalho.
 * @param {string[]} headerKeys Chaves por coluna (já únicas).
 * @param {string[]} row Valores da linha de dados.
 * @return {Record<string, string|null>} Mapa nome da coluna → valor.
 */
function rowToSisrexRecord(
  headerKeys: string[],
  row: string[],
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (let i = 0; i < headerKeys.length; i++) {
    out[headerKeys[i]] = cell(row, i);
  }
  return out;
}

export const buscarDadosProtocolo = onRequest(
  {secrets: ["SHEETS_SECRET"]},
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Preflight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const valorBusca = (req.query.valor as string | undefined)?.trim();

      if (!valorBusca) {
        res.status(400).json({
          error: "Parâmetro valor é obrigatório",
        });
        return;
      }

      const secret = process.env.SHEETS_SECRET;

      if (!secret) {
        res.status(500).json({
          error: "Credenciais da planilha não estão configuradas.",
        });
        return;
      }
      const credentials = JSON.parse(secret);
      if (!credentials) {
        res.status(500).json({
          error: "Credenciais da planilha não estão configuradas.",
        });
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      });

      const sheets = google.sheets({
        version: "v4",
        auth,
      });

      // 1) SISREX: cabeçalhos na linha 1; coluna PROTOCOLO por nome
      // (fallback: índice 8 = coluna I).
      try {
        const sisrexResp = await sheets.spreadsheets.values.get({
          spreadsheetId: SISREX_SPREADSHEET_ID,
          range: SISREX_RANGE,
        });
        const sisrexRows = sisrexResp.data.values ?? [];
        if (sisrexRows.length >= 2) {
          const rawHeaders = sisrexRows[0].map((h) => String(h ?? ""));
          const headerKeys = uniqueHeaderKeys(rawHeaders);
          let protoIdx = findHeaderIndex(rawHeaders, ["protocolo"]);
          if (protoIdx < 0) {
            protoIdx = 8;
          }

          for (let i = 1; i < sisrexRows.length; i++) {
            const protocoloCol = cell(sisrexRows[i], protoIdx);
            if (protocoloCol !== null && protocoloCol === valorBusca) {
              const sisrex = rowToSisrexRecord(headerKeys, sisrexRows[i]);

              const ixDataExame = findHeaderIndex(rawHeaders, ["data exame"]);
              const ixHoraExame = findHeaderIndex(rawHeaders, ["hora exame"]);
              const ixBase = findHeaderIndex(rawHeaders, ["base"]);
              const ixSetor = findHeaderIndex(rawHeaders, ["setor"]);
              const ixVitimas = findHeaderIndex(rawHeaders, [
                "vitima(s)",
                "vitimas",
              ]);
              const ixDataCadastro = findHeaderIndex(rawHeaders, [
                "data cadastro",
              ]);
              const ixLocal = findHeaderIndex(rawHeaders, ["local"]);

              const dataEx =
                ixDataExame >= 0 ? cell(sisrexRows[i], ixDataExame) : null;
              const horaEx =
                ixHoraExame >= 0 ? cell(sisrexRows[i], ixHoraExame) : null;
              const baseVal =
                ixBase >= 0 ? cell(sisrexRows[i], ixBase) : null;
              const setorVal =
                ixSetor >= 0 ? cell(sisrexRows[i], ixSetor) : null;
              const vitimasVal =
                ixVitimas >= 0 ? cell(sisrexRows[i], ixVitimas) : null;
              const cadastroVal =
                ixDataCadastro >= 0 ?
                  cell(sisrexRows[i], ixDataCadastro) :
                  null;
              const localVal =
                ixLocal >= 0 ? cell(sisrexRows[i], ixLocal) : null;

              res.json({
                fonte: "SISREX",
                sisrex,
                data: dataEx,
                hora: horaEx,
                destino: baseVal ?? setorVal,
                ip: null,
                vitima: vitimasVal,
                recebimento: cadastroVal,
                descricao: localVal,
              });
              return;
            }
          }
        }
      } catch (sisrexErr) {
        console.error("SISREX indisponível ou erro na leitura:", sisrexErr);
      }

      // 2) Legado — Registro 2026
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: REGISTRO_SPREADSHEET_ID,
        range: "'Registro - 2026'!B:X",
      });

      const rows = response.data.values ?? [];

      // pula cabeçalho
      for (let i = 1; i < rows.length; i++) {
        const protocolo = rows[i][0];
        const destino = rows[i][4]; // F
        const ip = rows[i][6]; // H
        const data = rows[i][8]; // J
        const hora = rows[i][9]; // K
        const descricao = rows[i][15]; // Q
        const vitima = rows[i][17]; // S
        const recebimento = rows[i][26]; // X

        if (protocolo === valorBusca) {
          res.json({
            fonte: "REGISTRO",
            data,
            hora,
            destino,
            ip,
            vitima,
            recebimento,
            descricao,
          });
          return;
        }
      }

      res.status(500).json({
        error: "Protocolo não encontrado",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Erro ao consultar planilha",
      });
    }
  },
);
