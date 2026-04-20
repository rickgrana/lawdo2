# Manual em Markdown — screenshots

## Login Google (obrigatório para todas as telas)

Para emitir capturas de **todas** as telas com dados reais, o Playwright precisa de uma **sessão Google** gravada. Use a **sua conta Google de perito** (a mesma onde ficam atendimentos e imagens).

1. Deixe o Lawdo a correr (ex.: `ionic serve` ou `npm run start` na porta que usar).
2. No terminal:
   ```bash
   cd docs/manual
   npm install
   npx playwright install chromium
   npm run screenshots:login
   ```
3. Abrirá uma janela do browser: clique **ENTRAR**, complete o login Google e eventuais permissões.
4. Quando a página inicial mostrar o botão **Atendimentos**, o script grava `.auth/storage.json` e termina.
5. Depois execute `npm run screenshots` para gerar todos os PNG.

Se saltar o passo do login, `npm run screenshots` **recusa-se a continuar** e pede para executar `screenshots:login` primeiro.

---

## Gerar todas as capturas de tela (perito)

As imagens ficam em `images/telas/capturas/` com nomes `01-inicio.png` … `23-laudo.png`.

### Requisitos

1. **Node.js** compatível com o projeto (≥ 20.19).
2. **Lawdo a correr** na mesma máquina (por defeito os scripts apontam para **`http://localhost:8100`**, igual ao **`ionic serve`** típico):
   ```bash
   export PATH="$HOME/.nvm/versions/node/v24.12.0/bin:$PATH"   # exemplo
   ionic serve
   # ou explicitamente:
   # npx ionic serve --host localhost --port 8100
   ```
   Use **sempre o mesmo host no browser e na variável**: `localhost` está nos domínios autorizados do Firebase por defeito; **`127.0.0.1` não** — provoca `auth/unauthorized-domain` até o adicionar na consola Firebase (ou até usar URLs com `localhost`).
   Se usar **`ng serve`** na porta **4200**, defina antes de capturar:
   ```bash
   export LAWDO_BASE_URL=http://localhost:4200
   ```
   Se a porta for outra, use `export LAWDO_BASE_URL=http://localhost:PORTA` e confirme no terminal o URL que o servidor mostra.
3. **Primeira vez — gravar login Google** (abre uma janela real do browser):
   ```bash
   cd docs/manual
   npm install
   npx playwright install chromium
   npm run screenshots:login
   ```
   Faça **ENTRAR** e conclua o login com a conta que usar na perícia. Quando aparecer o botão **Atendimentos**, o script grava `.auth/storage.json` e fecha.

4. **Gerar os PNG** (browser em modo invisível; **mantenha o terminal do servidor aberto**):
   ```bash
   npm run screenshots
   ```

O script cria um **atendimento de teste** no Firebase (protocolo gerado ao acaso) para poder abrir todas as secções. Apague esse caso pela lista **Atendimentos** se não quiser mantê-lo.

Variáveis opcionais:

- `LAWDO_BASE_URL` — por defeito `http://localhost:8100`. Para `ng serve` na 4200: `export LAWDO_BASE_URL=http://localhost:4200`. Se servir só em `127.0.0.1`, defina o mesmo URL aqui **e** acrescente `127.0.0.1` em Firebase → Authentication → Authorized domains.

### Linux / WSL: erro `libnspr4.so: cannot open shared object file`

O binário `chrome` do Playwright precisa das bibliotecas **NSPR** e **NSS** no sistema. Sem elas aparece exactamente este erro.

**1) Solução mais fiável (Ubuntu/Debian):** deixar o próprio Playwright pedir dependências ao `apt`:

O comando `sudo npx` falha com **«npx: command not found»** porque o `sudo` usa um **PATH** curto e não vê o Node instalado via **nvm**/utilizador. Preserve o PATH:

```bash
cd docs/manual   # dentro do repositório Lawdo
sudo apt-get update
sudo env "PATH=$PATH" npx playwright install-deps chromium
```

Se ainda não encontrar `npx`, carregue o **nvm** antes e volte a tentar:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
sudo env "PATH=$PATH" npx playwright install-deps chromium
```

Ou chame o `npx` pelo caminho absoluto:

```bash
sudo env "PATH=$PATH" "$(command -v npx)" playwright install-deps chromium
```

**2) Se preferir instalar só o mínimo para este erro:**

```bash
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3
```

Confirme que o ficheiro existe (caminho típico em 64-bit):

```bash
ls -la /usr/lib/x86_64-linux-gnu/libnspr4.so
```

Se `apt` disser que **não há candidato** para `libnspr4`, active o repositório **universe** (Ubuntu) e atualize outra vez:

```bash
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y universe
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3
```

**3) Resto das bibliotecas gráficas** (se aparecerem outros `error while loading shared libraries`):

```bash
sudo apt-get install -y libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 fonts-liberation
sudo apt-get install -y libasound2t64 2>/dev/null || sudo apt-get install -y libasound2
```

Depois volte a correr `npm run screenshots:login` ou `npm run screenshots`.

### Janela do Google abre e fecha logo

Causas frequentes:

1. **Google Chrome instalado no sistema** — O script tenta usar o canal `chrome` (Chrome real). Instale **Google Chrome para Linux** (pacote `.deb` oficial) ou, em último caso, o fluxo recai no Chromium do Playwright (onde o login Google costuma falhar ou fechar o popup).
2. **Domínio não autorizado no Firebase** (`auth/unauthorized-domain`) — Em [Firebase Console](https://console.firebase.google.com) → projeto **periam** → **Authentication** → **Settings** → **Authorized domains**, deve constar o **host exacto** que usa no URL (por defeito **`localhost`**). **`127.0.0.1` é outro domínio**: se abrir o Lawdo em `http://127.0.0.1:8100`, tem de acrescentar **`127.0.0.1`** à lista (ou preferir `http://localhost:8100` nos scripts e no browser).
3. **`LAWDO_PLAYWRIGHT_NO_CHROME=1`** — Força só o Chromium empacotado (útil para depuração): `LAWDO_PLAYWRIGHT_NO_CHROME=1 npm run screenshots:login`.

## Só tela inicial sem login

Na raiz do repositório existe também `capture-screenshots.sh` (Chrome headless no WSL + Windows), útil para poucas imagens sem sessão.
