# Manual em Markdown — screenshots

## Gerar todas as capturas de ecrã (perito)

As imagens ficam em `images/telas/capturas/` com nomes `01-inicio.png` … `23-laudo.png`.

### Requisitos

1. **Node.js** compatível com o projeto (≥ 20.19).
2. **Lawdo a correr** na mesma máquina, por exemplo na raiz do projeto:
   ```bash
   export PATH="$HOME/.nvm/versions/node/v24.12.0/bin:$PATH"   # exemplo
   npm run start -- --host 127.0.0.1 --port 4200
   ```
3. **Primeira vez — gravar login Google** (abre uma janela real do browser):
   ```bash
   cd docs/manual
   npm install
   npx playwright install chromium
   npm run screenshots:login
   ```
   Faça **ENTRAR** e conclua o login com a conta que usar na perícia. Quando aparecer o botão **Atendimentos**, o script grava `.auth/storage.json` e fecha.

4. **Gerar os PNG** (browser em modo invisível, **não fecha o terminal do `ng serve`**):
   ```bash
   npm run screenshots
   ```

O script cria um **atendimento de teste** no Firebase (protocolo gerado ao acaso) para poder abrir todas as secções. Apague esse caso pela lista **Atendimentos** se não quiser mantê-lo.

Variáveis opcionais:

- `LAWDO_BASE_URL` — por defeito `http://127.0.0.1:4200`.

## Só ecrã inicial sem login

Na raiz do repositório existe também `capture-screenshots.sh` (Chrome headless no WSL + Windows), útil para poucas imagens sem sessão.
