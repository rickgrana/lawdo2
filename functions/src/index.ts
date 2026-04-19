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
        const valorBusca = req.query.valor as string;

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

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: "1mzD83_cYq7J3brVK_9dOZWwwqbZgE7WntFi8ekRSJQs",
            range: "'Registro - 2026'!B:X",
        });

        const rows = response.data.values ?? [];

        // pula cabeçalho
        for (let i = 1; i < rows.length; i++) {
            const protocolo = rows[i][0]; // B
            const destino = rows[i][4]; // F
            const ip = rows[i][6]; // H
            const data = rows[i][8]; // J
            const hora = rows[i][9]; // K
            const descricao = rows[i][15]; // Q
            const vitima = rows[i][17]; // S
            const recebimento = rows[i][26]; // X

            if (protocolo === valorBusca) {
                res.json({
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
});

