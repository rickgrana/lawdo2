# Casos de Uso Detalhados - Lawdo

Este documento detalha os casos de uso com base no comportamento implementado no projeto (Ionic/Angular, Firebase Auth/Firestore, Google Drive, modulo de exportacao DOCX e gestao de imagens).

## 1) Autenticar-se
- **Atores:** Perito
- **Objetivo:** Acessar funcionalidades protegidas do sistema.
- **Pre-condicoes:** Usuario sem sessao ativa ou sessao expirada.
- **Fluxo principal:**
  1. Perito aciona login na tela inicial.
  2. Sistema autentica via popup Google (`signInWithPopup`) com escopos de Drive.
  3. Sistema carrega perfil no Firestore por UID.
  4. Se nao houver cadastro em `users`, cria estado `pendingRegistration` e redireciona para perfil.
- **Pos-condicoes:** Sessao autenticada e perfil carregado em memoria (`user$`).
- **Regras relevantes:** Rotas protegidas exigem `AuthGuard`; token OAuth do Drive e mantido para operacoes de arquivos.

## 2) Completar ou editar perfil profissional
- **Atores:** Perito
- **Objetivo:** Registrar dados profissionais usados no laudo.
- **Pre-condicoes:** Usuario autenticado.
- **Fluxo principal:**
  1. Sistema exibe formulario com nome, sexo, matricula, superior, corporacao e unidade.
  2. Perito informa/edita dados e salva.
  3. Sistema cria cadastro (primeiro acesso) ou atualiza cadastro existente.
- **Pos-condicoes:** Dados profissionais persistidos no Firestore.
- **Regras relevantes:** No primeiro acesso, apos salvar, o sistema remove estado pendente e redireciona para home.

## 3) Encerrar sessao
- **Atores:** Perito
- **Objetivo:** Finalizar acesso autenticado.
- **Pre-condicoes:** Sessao ativa.
- **Fluxo principal:**
  1. Perito aciona logout.
  2. Sistema executa `signOut`, limpa estado de usuario e token OAuth do Drive.
  3. Sistema retorna para tela inicial/home.
- **Pos-condicoes:** Usuario desautenticado.

## 4) Listar atendimentos
- **Atores:** Perito
- **Objetivo:** Consultar atendimentos vinculados ao usuario.
- **Pre-condicoes:** Sessao ativa.
- **Fluxo principal:**
  1. Sistema carrega lista por usuario com paginacao.
  2. Exibe itens com dados resumidos e permite abrir atendimento.
  3. Infinite scroll permite carregar mais registros.
- **Pos-condicoes:** Lista exibida para navegacao.

## 5) Iniciar novo atendimento
- **Atores:** Perito
- **Objetivo:** Abrir um novo processo pericial.
- **Pre-condicoes:** Sessao ativa.
- **Fluxo principal:**
  1. Perito confirma termo de privacidade para novo atendimento.
  2. Sistema prepara modelo de atendimento em memoria.
  3. Sistema navega para etapa de identificacao.
- **Pos-condicoes:** Atendimento em edicao iniciado.

## 6) Visualizar atendimento
- **Atores:** Perito
- **Objetivo:** Acessar painel consolidado do atendimento.
- **Pre-condicoes:** Sessao ativa e atendimento selecionado (`AtendimentoGuard`).
- **Fluxo principal:**
  1. Sistema carrega imagens do atendimento.
  2. Exibe secoes (identificacao, requisicao, local, preservacao, vitimas, laudo, vestigios, veiculos, imagens).
  3. Permite concluir/reabrir ocorrencia e exportar laudo.
- **Pos-condicoes:** Usuario pode navegar para edicao das secoes do atendimento.

## 7) Registrar requisicao e quesitos
- **Atores:** Perito
- **Objetivo:** Registrar requisicao formal e quesitos da autoridade.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito preenche numero, origem, delegado, data de recebimento, IP e destino.
  2. Sistema permite buscar/sugerir nomes de delegados.
  3. Perito adiciona/edita/remove quesitos em modal dedicado.
  4. Sistema persiste dados de requisicao e lista de quesitos.
- **Pos-condicoes:** Requisicao registrada e quesitos atualizados.
- **Regras relevantes:** Formulario fica bloqueado para atendimento concluido/arquivado.

## 8) Registrar local do exame
- **Atores:** Perito
- **Objetivo:** Registrar caracteristicas do local da pericia.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito informa zona, natureza, funcao, tipo, construcao, acesso, condicoes e descricao.
  2. Sistema valida campos obrigatorios.
  3. Sistema persiste dados da secao local.
- **Pos-condicoes:** Dados do local atualizados no atendimento.

## 9) Documentar preservacao do local e presentes
- **Atores:** Perito
- **Objetivo:** Registrar isolamento/preservacao e equipes/pessoas presentes.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito informa preservacao, isolamento e condicoes.
  2. Perito adiciona presentes (PM, Delegado, Investigador, IML ou Outro) com orgao, nome, cargo, origem e veiculo.
  3. Sistema valida nome do presente e, quando aplicavel, orgao "Outro".
  4. Sistema persiste lista normalizada de presentes.
- **Pos-condicoes:** Preservacao e presencas registradas.

## 10) Registrar conclusao e dinamica
- **Atores:** Perito
- **Objetivo:** Consolidar entendimento tecnico final.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito seleciona/sugere modelo de conclusao e dinamica.
  2. Perito ajusta texto final.
  3. Sistema persiste conclusao e dinamica.
- **Pos-condicoes:** Secao conclusiva pronta para compor o laudo.

## 11) Exportar laudo
- **Atores:** Perito
- **Objetivo:** Gerar documento final do laudo em DOCX.
- **Pre-condicoes:** Atendimento com numeracao de laudo preenchida (numero e ano) e usuario autenticado.
- **Fluxo principal:**
  1. Perito escolhe "Baixar o Laudo".
  2. Sistema monta documento via `DocumentoFactory` e converte com `Packer`.
  3. Sistema baixa arquivo localmente.
- **Pos-condicoes:** Arquivo `.docx` gerado para revisao/complementacao.
- **Regras relevantes:** Sem numero/ano de laudo, a geracao e interrompida com erro.

## 12) Enviar laudo para Google Drive
- **Atores:** Perito
- **Objetivo:** Persistir laudo em nuvem.
- **Pre-condicoes:** Permissao OAuth Drive e configuracao de pasta (ou pasta padrao).
- **Fluxo principal:**
  1. Perito escolhe "Salvar no Google Drive".
  2. Sistema gera blob DOCX do laudo.
  3. Sistema garante pasta de destino (`raiz configurada / ano-protocolo`).
  4. Sistema envia DOCX e informa caminho final ao usuario.
- **Pos-condicoes:** Documento salvo no Drive e referenciado por caminho logico.

## 13) Gerenciar vestigios do atendimento
- **Atores:** Perito
- **Objetivo:** Organizar vestigios por categoria.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Sistema agrupa vestigios por categorias predefinidas.
  2. Perito visualiza, inclui, edita ou remove itens.
  3. Sistema recalcula grupos apos alteracoes.
- **Pos-condicoes:** Vestigios consistentes por categoria.

## 14) Registrar / editar vestigio
- **Atores:** Perito
- **Objetivo:** Detalhar um vestigio especifico.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito escolhe categoria e abre formulario em modal.
  2. Informa descricao, quantidade e demais campos do tipo.
  3. Sistema persiste no bloco `fields.vestigios`.
- **Pos-condicoes:** Vestigio cadastrado ou alterado.

## 15) Registrar numeracao de laudo
- **Atores:** Perito
- **Objetivo:** Definir identificacao formal do laudo.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito preenche numero, ano e data do laudo.
  2. Sistema valida obrigatoriedade e persiste.
- **Pos-condicoes:** Numeracao habilita exportacao do documento.

## 16) Gerenciar veiculos do atendimento
- **Atores:** Perito
- **Objetivo:** Controlar lista de veiculos relacionados ao fato.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito visualiza lista de veiculos do atendimento.
  2. Pode abrir item existente ou adicionar novo.
- **Pos-condicoes:** Lista pronta para manutencao detalhada.

## 17) Registrar / editar veiculo
- **Atores:** Perito
- **Objetivo:** Manter dados tecnicos e de apresentacao do veiculo.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito preenche placa, tracao, tipo, especie, carroceria, marca, modelo, ano, chassi, cor e dados do responsavel.
  2. Sistema salva novo item ou atualiza item selecionado.
  3. Sistema permite exclusao com confirmacao.
- **Pos-condicoes:** Veiculo persistido no atendimento.

## 18) Gerenciar cadastro de vitimas
- **Atores:** Perito
- **Objetivo:** Administrar vitimas vinculadas ao atendimento.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito visualiza lista de vitimas.
  2. Pode adicionar, abrir para edicao ou remover com confirmacao.
- **Pos-condicoes:** Lista de vitimas atualizada.

## 19) Cadastrar vitima
- **Atores:** Perito
- **Objetivo:** Registrar identificacao e estado da vitima.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito preenche dados de identificacao, sexo, RG, idade, estado, posicao e localizacao.
  2. Sistema salva como novo item em `fields.vitimas`.
- **Pos-condicoes:** Vitima criada e associada ao atendimento.

## 20) Registrar ferimentos
- **Atores:** Perito
- **Objetivo:** Registrar achados de lesoes, inclusive PAF.
- **Pre-condicoes:** Vitima em edicao.
- **Fluxo principal:**
  1. Perito informa campos de PAF (frente/costas) e marcacoes de mapa corporal.
  2. Opcionalmente abre mapa corporal para marcacao visual.
  3. Sistema persiste no registro da vitima.
- **Pos-condicoes:** Ferimentos e marcacoes vinculados a vitima.

## 21) Registrar tatuagens
- **Atores:** Perito
- **Objetivo:** Apoiar identificacao por sinais particulares.
- **Pre-condicoes:** Vitima em edicao.
- **Fluxo principal:**
  1. Perito adiciona itens de tatuagem (regiao e descricao).
  2. Sistema serializa lista para armazenamento e exportacao.
- **Pos-condicoes:** Tatuagens registradas no cadastro da vitima.

## 22) Registrar pertences
- **Atores:** Perito
- **Objetivo:** Registrar objetos associados a vitima.
- **Pre-condicoes:** Vitima em edicao.
- **Fluxo principal:**
  1. Perito adiciona itens de pertences.
  2. Sistema serializa lista para persistencia.
- **Pos-condicoes:** Pertences vinculados ao registro da vitima.

## 23) Registrar vestes
- **Atores:** Perito
- **Objetivo:** Descrever vestimentas da vitima.
- **Pre-condicoes:** Vitima em edicao.
- **Fluxo principal:**
  1. Perito informa vestes de cabeca, superior, inferior e calcados.
  2. Sistema persiste no bloco de vestes da vitima.
- **Pos-condicoes:** Vestes disponiveis para laudo e analise.

## 24) Gerenciar imagens e croquis do atendimento
- **Atores:** Perito
- **Objetivo:** Organizar evidencias visuais.
- **Pre-condicoes:** Atendimento ativo e permissao para upload.
- **Fluxo principal:**
  1. Perito acessa galeria de imagens do atendimento.
  2. Pode adicionar, ordenar, abrir para edicao e excluir imagens.
  3. Sistema sincroniza metadados e referencia de armazenamento (Drive/legado).
- **Pos-condicoes:** Acervo visual atualizado.

## 25) Capturar ou anexar imagem
- **Atores:** Perito
- **Objetivo:** Incluir novas imagens ao atendimento.
- **Pre-condicoes:** Atendimento ativo.
- **Fluxo principal:**
  1. Perito escolhe origem: galeria ou camera.
  2. Sistema converte HEIC quando necessario, redimensiona e transforma em JPEG.
  3. Sistema faz upload para Drive e grava referencia da imagem no atendimento.
- **Pos-condicoes:** Imagens persistidas e associadas ao atendimento.

## 26) Capturar coordenadas da imagem
- **Atores:** Perito
- **Objetivo:** Aproveitar geolocalizacao EXIF para apoio pericial.
- **Pre-condicoes:** Imagem com metadados GPS.
- **Fluxo principal:**
  1. Sistema extrai `lat/long` do arquivo.
  2. Armazena coordenadas na imagem.
  3. Se atendimento ainda sem coordenadas, pergunta se deve aplicar no atendimento.
- **Pos-condicoes:** Coordenadas registradas na imagem e opcionalmente no atendimento.

## 27) Redimensionar imagem
- **Atores:** Perito
- **Objetivo:** Otimizar tamanho para upload e uso no laudo.
- **Pre-condicoes:** Arquivo selecionado ou imagem em edicao.
- **Fluxo principal:**
  1. Sistema ajusta proporcao para altura alvo (~500px).
  2. Regera JPEG com qualidade configurada.
  3. Usa resultado para visualizacao e upload.
- **Pos-condicoes:** Imagem otimizada e pronta para persistencia.

## 28) Salvar no Google Drive (imagens)
- **Atores:** Perito
- **Objetivo:** Guardar imagens em estrutura padronizada no Drive.
- **Pre-condicoes:** Permissao OAuth Drive ativa.
- **Fluxo principal:**
  1. Sistema resolve/cria pasta raiz configurada.
  2. Resolve/cria subpasta `ano-protocolo`.
  3. Faz upload de imagens e guarda `driveFileId`.
- **Pos-condicoes:** Imagens acessiveis no caminho do Drive do atendimento.

## 29) Visualizar imagem
- **Atores:** Perito
- **Objetivo:** Inspecionar imagem individualmente.
- **Pre-condicoes:** Imagem existente no atendimento.
- **Fluxo principal:**
  1. Sistema carrega imagem selecionada.
  2. Exibe legenda, coordenadas e ferramentas de edicao.
- **Pos-condicoes:** Imagem pronta para analise e ajuste.

## 30) Cortar imagem
- **Atores:** Perito
- **Objetivo:** Ajustar enquadramento da evidencia.
- **Pre-condicoes:** Imagem carregada.
- **Fluxo principal:**
  1. Perito ativa ferramenta de corte.
  2. Define area de interesse.
  3. Sistema aplica recorte e atualiza preview.
- **Pos-condicoes:** Imagem recortada para melhor foco pericial.

## 31) Desenhar na imagem
- **Atores:** Perito
- **Objetivo:** Marcar pontos relevantes na imagem.
- **Pre-condicoes:** Imagem carregada.
- **Fluxo principal:**
  1. Perito ativa modo desenho e escolhe cor.
  2. Realiza anotacoes em canvas sobreposto.
  3. Sistema mescla anotacao com imagem e atualiza fonte.
- **Pos-condicoes:** Imagem com anotacoes incorporadas.

## 32) Identificar PAF
- **Atores:** Perito
- **Objetivo:** Apoiar identificacao de perfuracoes por arma de fogo.
- **Pre-condicoes:** Imagem adequada (regiao toracica), servico de deteccao disponivel.
- **Fluxo principal:**
  1. Sistema solicita confirmacao de contexto da imagem.
  2. Executa deteccao remota (`FirearmDetectionService`).
  3. Atualiza legenda com quantidade detectada.
  4. Exibe imagem resultante com marcacoes.
- **Pos-condicoes:** Resultado de deteccao incorporado para analise.

## 33) Identificar manchas de sangue
- **Atores:** Perito
- **Objetivo:** Apoiar analise de padroes hematicos.
- **Pre-condicoes:** Imagem valida e servico de deteccao disponivel.
- **Fluxo principal:**
  1. Sistema executa deteccao remota (`BloodstainDetectionService`).
  2. Atualiza legenda com quantidade de manchas detectadas.
  3. Renderiza imagem com marcacoes de resultado.
- **Pos-condicoes:** Evidencia visual enriquecida para suporte ao laudo.

---

## Relacoes importantes entre casos de uso
- **Exportar laudo** inclui **Registrar numeracao de laudo** (sem numero/ano, nao gera DOCX).
- **Enviar laudo para Google Drive** depende de **Autenticar-se** e permissao OAuth de Drive.
- **Capturar/anexar imagem** inclui **Redimensionar imagem** e pode incluir **Capturar coordenadas da imagem**.
- **Gerenciar imagens** pode estender para **Cortar imagem**, **Desenhar na imagem**, **Identificar PAF** e **Identificar manchas de sangue**.

