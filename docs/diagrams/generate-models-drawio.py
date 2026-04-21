#!/usr/bin/env python3
"""Gera docs/diagrams/models-lawdo.drawio para importação no diagrams.net / draw.io."""

from __future__ import annotations

import html
from pathlib import Path


def box(id_: str, value_lines: list[str], x: float, y: float, w: float, h: float | None, parent: str = "1") -> str:
    text = "&#xa;".join(html.escape(line, quote=False) for line in value_lines)
    h = h if h is not None else max(56, 24 + 16 * len(value_lines))
    style = (
        "rounded=0;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=6;"
        "fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;"
    )
    return (
        f'<mxCell id="{id_}" value="{text}" style="{style}" vertex="1" parent="{parent}">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>'
        f"</mxCell>"
    )


def edge(id_: str, src: str, tgt: str, label: str = "", style_extra: str = "") -> str:
    base = "edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;exitX=0.5;exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;"
    lbl = "html=1;align=center;verticalAlign=middle;fontSize=10;labelBackgroundColor=#ffffff;"
    style = base + style_extra
    geo = '<mxGeometry relative="1" as="geometry"/>'
    if label:
        val = html.escape(label, quote=False).replace('"', "&quot;")
        return (
            f'<mxCell id="{id_}" value="{val}" style="{style}{lbl}" edge="1" parent="1" source="{src}" target="{tgt}">'
            f"{geo}</mxCell>"
        )
    return (
        f'<mxCell id="{id_}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">'
        f"{geo}</mxCell>"
    )


def page(name: str, page_id: str, cells: list[str]) -> str:
    root = (
        '<mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" '
        'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        'pageWidth="1600" pageHeight="2000" math="0" shadow="0">'
        "<root>"
        '<mxCell id="0"/>'
        '<mxCell id="1" parent="0"/>'
        + "".join(cells)
        + "</root></mxGraphModel>"
    )
    return f'<diagram id="{page_id}" name="{html.escape(name)}">{root}</diagram>'


def main() -> None:
    out: Path = Path(__file__).resolve().parent / "models-lawdo.drawio"

    # --- Página 1: agregado Atendimento + estruturas aninhadas ---
    p1: list[str] = []

    p1.append(
        box(
            "af",
            [
                "«estrutura» AtendimentoFields",
                "perito: object",
                "situacao: number",
                "data, hora: string",
                "natureza, tipoExame: string",
                "conclusao, dinamica: string",
                "protocolo { numero, ano }",
                "coordenadas { lat, long }",
                "endereco { cidade, bairro, logradouro, pontoref }",
                "laudo { numero, ano, data }",
                "possuiRequisicao: boolean",
                "requisicao { recebida, numero, origem, destino, delegado, recebimento, ip }",
                "local { natureza, zona, funcao, tipo, construcao, isolamento, preservacao, condicoes, descricao, acesso }",
                "equipes.pc { presente, delegado, investigacao, vtr, origem }",
                "equipes.pm { presente, representante, origem, vtr }",
                "presentes: PresenteNoLocal[]",
                "armas { encontradas, items[] }",
                "dtcriacao, dtupdate: any",
                "vitimas: Vitima[]",
                "veiculos: Veiculo[]",
                "vestigios: Vestigio[]",
            ],
            40,
            40,
            340,
            None,
        )
    )

    p1.append(
        box(
            "att",
            [
                "Atendimento",
                "+ {static} SIT_ABERTO / ANDAMENTO / CONCLUIDO / ARQUIVADO",
                "+ isNew: boolean",
                "+ id: any",
                "+ fields: AtendimentoFields (literal no TS)",
                "+ quesitos: Quesito[]",
                "+ imagens: Imagem[]",
                "+ situacoes: Map&lt;number,string&gt;",
            ],
            420,
            40,
            320,
            None,
        )
    )

    p1.append(
        box(
            "img",
            [
                "«interface» Imagem",
                "nome: string",
                "imagem: string",
                "legenda: string",
                "colunas?: number",
                "driveFileId?: string",
            ],
            800,
            40,
            240,
            None,
        )
    )

    p1.append(
        box(
            "pnl",
            [
                "«interface» PresenteNoLocal",
                "orgao: string",
                "nome: string",
                "cargo: string",
                "origem: string",
                "veiculo: string",
            ],
            800,
            220,
            240,
            None,
        )
    )

    p1.append(
        box(
            "base",
            [
                "Base",
                "+ isNew: boolean",
                "+ id: string",
                "+ fields: object",
            ],
            40,
            520,
            200,
            None,
        )
    )

    p1.append(
        box(
            "vit",
            [
                "Vitima",
                "+ index: any",
                "+ identificada: string | boolean",
                "+ nome, sexo, complfisica, etnia: string",
                "+ idade: number",
                "+ condicoes: string",
                "+ cabelo: Cabelo",
                "+ posicao, estado, estatura, porte: string",
                "+ rg, localizacao: string",
                "+ vestes { cabeca, superior, inferior, calcados }",
                "+ pertences, tatuagens: string",
                "+ paf_frente, paf_costas, paf_mapa_marcacoes: string",
                "+ observacoes: string",
                "+ vestigios: VitimaVestigio[]",
            ],
            280,
            520,
            280,
            None,
        )
    )

    p1.append(
        box(
            "cab",
            ["Cabelo", "+ tipo: string", "+ cor: string", "+ comprimento: string"],
            280,
            380,
            160,
            None,
        )
    )

    p1.append(
        box(
            "vei",
            [
                "Veiculo",
                "+ index: string",
                "+ placa, tracao, tipo, especie, carroceria: string",
                "+ marca, modelo, ano, chassi, cor, categoria: string",
                "+ apresentacao { responsavel, doc_responsavel, local }",
                "+ avarias: []",
            ],
            600,
            520,
            280,
            None,
        )
    )

    p1.append(
        box(
            "que",
            ["Quesito", "+ pergunta: string", "+ resposta: string"],
            920,
            520,
            200,
            None,
        )
    )

    p1.append(
        box(
            "corp",
            ["Corporacao", "+ fields { sigla, uf, nome }"],
            1160,
            520,
            200,
            None,
        )
    )

    p1.append(
        box(
            "uni",
            [
                "Unidade",
                "+ fields { sigla, corporacao, nome, status, criacao{data,usuario} }",
            ],
            1160,
            660,
            280,
            None,
        )
    )

    p1.append(
        box(
            "vv",
            [
                "«interface» VitimaVestigio",
                "visao: MapaVisao",
                "regiao: MapaRegiao",
                "tipoVestigio: MapaTipoVestigio",
                "quantidade: number",
                "coordenadas: VitimaVestigioCoordenada[]",
            ],
            600,
            380,
            280,
            None,
        )
    )

    p1.append(
        box(
            "vvc",
            ["«interface» VitimaVestigioCoordenada", "+ x: number", "+ y: number"],
            920,
            380,
            260,
            None,
        )
    )

    p1.append(
        box(
            "usrf",
            [
                "UserFields",
                "+ uid, email: string",
                "+ photoURL?, displayName?, favoriteColor?",
                "+ nomeCompleto?, sexo?, matricula?",
                "+ parcerias?, uf?, corporacao?, unidade?, superior?",
                "+ parceriaAuthCode?, parceriaAuthDate?",
            ],
            40,
            880,
            300,
            None,
        )
    )

    p1.append(
        box(
            "usr",
            [
                "User",
                "+ uid: string",
                "+ ref: string",
                "+ fields: UserFields",
                "+ config?: UserConfig",
                "+ corporacao?: Corporacao",
                "+ orgao?: Orgao",
                "+ pendingRegistration?: boolean",
            ],
            380,
            880,
                280,
            None,
        )
    )

    p1.append(
        box(
            "ucfg",
            ["«interface» UserConfig", "+ driveImageFolder?: string", "+ driveImageFolderId?: string"],
            380,
            760,
            260,
            None,
        )
    )

    p1.append(
        box(
            "org",
            ["Orgao", "- isNew: boolean", "+ id: string", "+ fields { sigla, nome, uf, cidade, status, criacao }"],
            700,
            880,
            320,
            None,
        )
    )

    # edges pg1
    inh = "endArrow=block;endFill=0;dashed=0;html=1;strokeWidth=1;"
    p1.append(edge("e1", "vit", "base", "", inh))
    p1.append(edge("e2", "vei", "base", "", inh))
    p1.append(edge("e3", "que", "base", "", inh))
    p1.append(edge("e4", "corp", "base", "", inh))
    p1.append(edge("e5", "uni", "base", "", inh))
    p1.append(edge("e6", "vit", "cab", "", "endArrow=diamondThin;endFill=1;html=1;startArrow=none;"))
    p1.append(edge("e7", "vv", "vvc", "1..*", "endArrow=open;html=1;"))
    p1.append(edge("e8", "usr", "usrf", "", "endArrow=diamondThin;endFill=1;html=1;startArrow=none;"))
    p1.append(edge("e9", "usr", "ucfg", "", "endArrow=open;dashed=1;html=1;"))
    p1.append(edge("e10", "usr", "corp", "", "endArrow=open;dashed=1;html=1;"))
    p1.append(edge("e11", "usr", "org", "", "endArrow=open;dashed=1;html=1;"))
    p1.append(edge("e12", "att", "af", "", "endArrow=diamondThin;endFill=1;html=1;startArrow=none;"))
    p1.append(edge("e13", "att", "img", "", "endArrow=open;html=1;dashed=1;"))

    doc1 = page("Lawdo — models (domínio e utilizador)", "page1", p1)

    # --- Página 2: Vestígios ---
    p2: list[str] = []

    p2.append(
        box(
            "vest",
            [
                "Vestigio",
                "+ tipo: string",
                "+ subtipo: string",
                "+ suporte_primario: string",
                "+ localizacao: string",
                "+ descricao: string",
                "+ coletado: boolean",
                "+ entregue: boolean",
                "+ coleta_suporte: string",
                "+ coleta_encaminhada: boolean",
                "+ encaminhamento_destino: string",
                "+ encaminhamento_doc: string",
                "+ entrega_responsavel: string",
            ],
            400,
            40,
            320,
            None,
        )
    )

    p2.append(
        box(
            "man",
            ["Mancha", "+ padrao: string"],
            200,
            380,
            200,
            None,
        )
    )

    p2.append(
        box(
            "mp",
            ["ManchaPassiva", "(sem campos extra)"],
            40,
            620,
            160,
            None,
        )
    )

    p2.append(
        box(
            "ms",
            ["ManchaSalpicos", "(sem campos extra)"],
            220,
            620,
            160,
            None,
        )
    )

    p2.append(
        box(
            "ma",
            ["ManchaAlterada", "(sem campos extra)"],
            400,
            620,
            160,
            None,
        )
    )

    p2.append(
        box(
            "fer",
            ["Ferimento", "+ natureza: string", "+ x: number", "+ y: number"],
            760,
            380,
            220,
            None,
        )
    )

    p2.append(
        box(
            "vvit",
            ["VestigioVitima", "# tipo: string", "+ visao: string"],
            800,
            60,
            220,
            None,
        )
    )

    p2.append(
        box(
            "arma",
            ["Arma", "+ tipo: number"],
            800,
            200,
            160,
            None,
        )
    )

    p2.append(
        box(
            "uf",
            ["Uf", "+ {static} opcoes: string[]"],
            800,
            320,
            200,
            None,
        )
    )

    inh = "endArrow=block;endFill=0;html=1;"
    p2.append(edge("p2e1", "man", "vest", "", inh))
    p2.append(edge("p2e2", "fer", "vest", "", inh))
    p2.append(edge("p2e3", "mp", "man", "", inh))
    p2.append(edge("p2e4", "ms", "man", "", inh))
    p2.append(edge("p2e5", "ma", "man", "", inh))

    doc2 = page("Lawdo — models (vestígios / sangue)", "page2", p2)

    mxfile = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<mxfile host="app.diagrams.net" modified="2026-01-01T00:00:00.000Z" '
        'agent="lawdo-generator" version="22.1.0" type="device">'
        f"{doc1}{doc2}"
        "</mxfile>"
    )

    out.write_text(mxfile, encoding="utf-8")
    print(f"Escrito: {out}")


if __name__ == "__main__":
    main()
