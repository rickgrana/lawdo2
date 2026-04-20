/**
 * Gera screenshots reais de cada tela (perito com sessão + atendimento de teste no browser).
 * Ver comentário no topo de `package.json` no mesmo diretório.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANUAL_ROOT = path.join(__dirname, '..');
const AUTH = path.join(MANUAL_ROOT, '.auth', 'storage.json');
/** Perfil Chromium em disco — mantém IndexedDB do Firebase (o `storage.json` sozinho é insuficiente). */
const PERSISTENT_PROFILE_DIR = path.join(MANUAL_ROOT, '.auth', 'playwright-profile');
/** Escrito após `screenshots:login` bem sucedido; o tour exige isto (não basta `storage.json`). */
const SESSION_MARKER = path.join(MANUAL_ROOT, '.auth', 'session.ok');
const OUT = path.join(MANUAL_ROOT, 'images', 'telas', 'capturas');
/** Alinhar com `ionic serve` (localhost). 127.0.0.1 ≠ localhost no Firebase (domínios autorizados). */
const BASE = process.env.LAWDO_BASE_URL || 'http://localhost:8100';

/**
 * Depois do botão «Atendimentos» (login gravado) e ao abrir o tour com `.auth`, dá tempo ao Firebase,
 * IndexedDB e `profileReady$`. Variável opcional: LAWDO_POST_LOGIN_MS (por defeito 5000).
 */
const POST_LOGIN_SETTLE_MS = Math.max(0, Number(process.env.LAWDO_POST_LOGIN_MS || 5000));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Home com `usuario`: botão «Atendimentos»; sem sessão: «ENTRAR». Usado no tour após restaurar `.auth`.
 * LAWDO_SESSION_WAIT_MS — timeout máximo (por defeito 120 s).
 */
async function waitForHomeLoggedIn(page) {
  const ms = Number(process.env.LAWDO_SESSION_WAIT_MS || 120000);
  const atendBtn = () => page.getByRole('button', { name: /^Atendimentos$/ }).first();

  try {
    await atendBtn().waitFor({ state: 'visible', timeout: ms });
    return;
  } catch {
    const entrarVisible = await page
      .getByRole('button', { name: /^ENTRAR$/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (entrarVisible) {
      console.warn(
        '[screenshots] Ainda «ENTRAR» na home — reload único (hidratação Firebase / IndexedDB)…',
      );
      await page.reload({ waitUntil: 'load', timeout: 120000 });
      await atendBtn().waitFor({ state: 'visible', timeout: ms });
      return;
    }
    throw new Error(
      `Sessão não detectada na página inicial (sem botão «Atendimentos»). ` +
        `O Firebase Auth usa IndexedDB no browser; o ficheiro .auth tem de ser gravado com IndexedDB incluído. ` +
        `Execute: cd docs/manual && npm run screenshots:login ` +
        `(usa perfil em .auth/playwright-profile). Apague .auth/session.ok e a pasta playwright-profile para forçar novo login.`,
    );
  }
}

function pathnameNormalized(url) {
  try {
    return new URL(url).pathname.replace(/\/$/, '') || '/';
  } catch {
    return '';
  }
}

/** Path da lista «Atendimentos» na SPA. */
function isAtendimentosUrl(url) {
  return pathnameNormalized(url) === '/atendimentos';
}

/**
 * Espera pelo componente lazy `app-atendimentos` e pela primeira «página» da lista (`carregar`).
 * — O infinite scroll só corre **depois** disto (com itens); não é a causa de timeout em `app-atendimentos`.
 * — Timeout aqui costuma ser URL ≠ `/atendimentos`, chunk lazy lento, ou Guard antes do router estabilizar.
 */
async function waitForAtendimentosListFirstPage(page) {
  try {
    await page.waitForURL(/\/atendimentos/, { timeout: 30000 });
  } catch {
    throw new Error(
      `Timeout à espera da rota /atendimentos (URL actual: ${page.url()}). ` +
        `Isto não é o scroll infinito — verifique sessão, AuthGuard e LAWDO_BASE_URL.`,
    );
  }

  await page.locator('app-atendimentos').waitFor({ state: 'attached', timeout: 10000 });

  await page.waitForFunction(
    () => {
      const root = document.querySelector('app-atendimentos');
      if (!root) return false;
      if (root.querySelector('.lista-vazia')) return true;
      if (root.querySelector('ion-list ion-item')) return true;
      return false;
    },
    null,
    { timeout: 10000 },
  );
}

/** Espera o *ngIf="usuario" no menu e o routerLink para a lista existirem no DOM. */
async function waitForMenuAtendimentosLink(page) {
  await page.waitForFunction(
    () => {
      const menu = document.querySelector('ion-menu');
      if (!menu) return false;
      const items = [...menu.querySelectorAll('ion-item')];
      const hasRouter = items.some((el) => {
        const r = el.getAttribute('routerlink') || el.getAttribute('routerLink') || '';
        return r.replace(/\/$/, '') === '/atendimentos';
      });
      const hasA = [...menu.querySelectorAll('a')].some((a) => {
        try {
          const p = new URL(a.href).pathname.replace(/\/$/, '') || '/';
          return p === '/atendimentos';
        } catch {
          return false;
        }
      });
      return hasRouter || hasA;
    },
    null,
    { timeout: 10000 },
  );
}

async function clickAtendimentosInMenu(page) {
  const menuBtn = page.locator('ion-menu-button');
  if (await menuBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await menuBtn.click();
    await wait(500);
  }

  const menuScope = page.locator('ion-menu');
  const tryClick = async (loc) => {
    await loc.first().click({ timeout: 9000 });
  };

  const locators = [
    () => menuScope.locator('ion-item[routerlink="/atendimentos"]'),
    () => menuScope.locator('ion-item[routerLink="/atendimentos"]'),
    () => menuScope.locator('a[href="/atendimentos"]'),
    () => menuScope.getByRole('link', { name: /^\s*Atendimentos\s*$/ }),
    () => menuScope.getByText(/^\s*Atendimentos\s*$/),
  ];

  for (const mk of locators) {
    try {
      await tryClick(mk());
      await page.waitForURL(/\/atendimentos/, { timeout: 25000 });
      return true;
    } catch {
      /* seguinte */
    }
  }

  const clicked = await page.evaluate(() => {
    const menu = document.querySelector('ion-menu');
    const scope = menu ?? document.body;
    const pathOk = (href) => {
      try {
        const p = new URL(href, window.location.origin).pathname.replace(/\/$/, '') || '/';
        return p === '/atendimentos';
      } catch {
        return false;
      }
    };
    const links = [...scope.querySelectorAll('a')];
    const a = links.find((el) => pathOk(el.getAttribute('href') || el.href));
    if (a) {
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    const items = [...scope.querySelectorAll('ion-item')];
    const byRouter = items.find((el) => {
      const r = el.getAttribute('routerlink') || el.getAttribute('routerLink') || '';
      return r.replace(/\/$/, '') === '/atendimentos';
    });
    if (byRouter) {
      byRouter.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  });

  if (!clicked) return false;
  try {
    await page.waitForURL(/\/atendimentos/, { timeout: 25000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * `indexedDBLocalPersistence` pode hidratar depois do primeiro load; vários `goto` intercalados com
 * esperas costumam estabilizar antes do AuthGuard redireccionar para /home.
 */
async function gotoAtendimentosListWithRetry(page, baseUrl) {
  const target = `${String(baseUrl).replace(/\/$/, '')}/atendimentos`;
  await wait(1500);

  for (let attempt = 0; attempt < 12; attempt++) {
    await wait(attempt * 350);
    await page.goto(target, {
      /** `networkidle` raramente concretiza com Vite/HMR (WebSocket). */
      waitUntil: 'domcontentloaded',
      timeout: 120000,
    });
    await wait(900 + attempt * 350);

    try {
      await page.waitForURL(/\/atendimentos/, { timeout: 20000 });
      await page.locator('app-atendimentos').first().waitFor({ state: 'attached', timeout: 25000 });
      await waitForAtendimentosListFirstPage(page);
      return;
    } catch {
      /* nova tentativa após mais tempo para o Firebase / IndexedDB */
    }
  }

  throw new Error(
    `Não foi possível abrir /atendimentos após várias tentativas (URL actual: ${page.url()}). ` +
      `Volte a gravar a sessão: cd docs/manual && npm run screenshots:login`,
  );
}

/**
 * Evita um `goto` extra quando já estamos na lista; caso contrário menu (sem reload brusco) ou
 * `gotoAtendimentosListWithRetry` quando a URL é /home e o menu ainda não tem o item (*ngIf).
 */
async function ensureAtendimentosWithoutReload(page) {
  const base = String(BASE).replace(/\/$/, '');

  for (let i = 0; i < 15; i++) {
    if (isAtendimentosUrl(page.url())) {
      await waitForAtendimentosListFirstPage(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await wait(600);
      return;
    }
    await wait(200);
  }

  await waitForMenuAtendimentosLink(page).catch(() => {});

  let menuOk = false;
  try {
    menuOk = await clickAtendimentosInMenu(page);
  } catch {
    menuOk = false;
  }

  if (menuOk && isAtendimentosUrl(page.url())) {
    await waitForAtendimentosListFirstPage(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(600);
    return;
  }

  await gotoAtendimentosListWithRetry(page, base);

  if (!isAtendimentosUrl(page.url())) {
    throw new Error(
      `Lista de atendimentos indisponível (URL: ${page.url()}). Execute: cd docs/manual && npm run screenshots:login`,
    );
  }

  await waitForAtendimentosListFirstPage(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(600);
}

/**
 * Opções partilhadas por `launchPersistentContext` (perfil em disco).
 * Preferir canal `chrome` para o popup Google; ver LAWDO_PLAYWRIGHT_NO_CHROME.
 */
function getPersistentContextOptions() {
  const useChrome = process.env.LAWDO_PLAYWRIGHT_NO_CHROME !== '1';
  const o = {
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
  };
  if (process.env.LAWDO_PLAYWRIGHT_USER_AGENT) {
    o.userAgent = process.env.LAWDO_PLAYWRIGHT_USER_AGENT;
  }
  if (useChrome) {
    o.channel = 'chrome';
  }
  return o;
}

async function mkdirp(d) {
  await fs.promises.mkdir(d, { recursive: true });
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('OK', file);
}

async function loginFlow() {
  await mkdirp(PERSISTENT_PROFILE_DIR);
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  LOGIN GOOGLE NECESSÁRIO PARA CAPTURAS DE TODAS AS TELAS                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  A sessão fica num perfil Chromium em disco (.auth/playwright-profile) —   ║
║  necessário para o Firebase Auth (IndexedDB).                               ║
║  1) Confirme que o Lawdo está a correr (ex.: npm run start na raiz).       ║
║  2) Vai abrir-se uma janela do browser neste computador.                   ║
║  3) Toque em ENTRAR e inicie sessão com a SUA conta Google de perito       ║
║     (a mesma onde ficam os atendimentos e imagens).                         ║
║  4) Aceite permissões do Google/Drive se o browser pedir.                  ║
║  5) Quando vir o botão «Atendimentos» na página inicial, o script continua. ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  const loginOpts = { ...getPersistentContextOptions(), headless: false };

  let context;
  try {
    context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, loginOpts);
  } catch (e) {
    console.warn(
      'Aviso: não foi possível abrir com canal «chrome». A tentar Chromium empacotado…',
      (e && e.message) || e,
    );
    const { channel, ...rest } = loginOpts;
    context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, rest);
  }

  const page = context.pages()[0] ?? (await context.newPage());

  page.on('console', (msg) => {
    const t = msg.text();
    if (/error|firebase|auth|popup/i.test(t)) {
      console.log('[browser]', msg.type(), t);
    }
  });

  await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await wait(800);

  console.log('>>> Clique em ENTRAR e conclua o login na janela Google.');
  console.log('>>> Se a janela Google fechar na hora: Chrome instalado OU Firebase → Authorized domains com o mesmo host do URL (localhost ≠ 127.0.0.1). À espera do botão «Atendimentos»… (até 5 min)\n');

  await page.getByRole('button', { name: /Atendimentos/i }).waitFor({ state: 'visible', timeout: 300000 });
  if (POST_LOGIN_SETTLE_MS > 0) {
    console.log(
      `>>> Aguardando ${POST_LOGIN_SETTLE_MS} ms (LAWDO_POST_LOGIN_MS) para sessão/perfil estabilizarem…`,
    );
    await wait(POST_LOGIN_SETTLE_MS);
  }

  await context.storageState({ path: AUTH, indexedDB: true });
  await fs.promises.writeFile(SESSION_MARKER, `${new Date().toISOString()}\n`, 'utf8');

  await context.close();

  console.log('\n✓ Perfil persistente (sessão Firebase):', PERSISTENT_PROFILE_DIR);
  console.log('✓ Marcador:', SESSION_MARKER);
  console.log('✓ Cópia auxiliar storageState (+ IndexedDB):', AUTH);
  console.log('  Agora execute: npm run screenshots\n');
}

async function ensureHub(page) {
  await wait(600);
  if (page.url().includes('atendimento/visualizar')) return;
  for (let i = 0; i < 8; i++) {
    const back = page.locator('ion-back-button button, ion-back-button').first();
    if (await back.isVisible().catch(() => false)) {
      await back.click();
      await wait(900);
    }
    if (page.url().includes('atendimento/visualizar')) return;
  }
}

async function openFromHub(page, textoNaLista, file) {
  await ensureHub(page);
  await wait(500);
  await page.locator('ion-item.secao_atendimento').filter({ hasText: textoNaLista }).first().click({ timeout: 20000 });
  await wait(2200);
  await shot(page, file);
}

async function clickFirstBack(page) {
  const back = page.locator('ion-back-button button, ion-back-button').first();
  if (await back.isVisible({ timeout: 3000 }).catch(() => false)) {
    await back.click();
    await wait(1200);
  }
}

async function fillIdentificacao(page) {
  /**
   * Lista → Novo (client-side). Evitar `goto` para /atendimentos aqui — ver `ensureAtendimentosWithoutReload`.
   */
  await ensureAtendimentosWithoutReload(page);

  const listRoot = page.locator('app-atendimentos').first();
  await listRoot.waitFor({ state: 'attached', timeout: 90000 });
  await listRoot.scrollIntoViewIfNeeded();
  await wait(800);

  const headerNovo = listRoot.locator('ion-header ion-buttons[slot="end"] ion-button').first();
  try {
    await headerNovo.click({ timeout: 8000 });
  } catch {
    await listRoot.getByRole('button', { name: /Novo atendimento/i }).click({ timeout: 15000 });
  }

  await page.waitForURL(/\/atendimento\/identificacao/, { timeout: 90000 });

  const idPage = page.locator('app-identificacao');
  await idPage.waitFor({ state: 'attached', timeout: 90000 });
  await wait(1200);

  const protoIn = idPage.locator('ion-input.input-protocolo input.native-input');
  await protoIn.waitFor({ state: 'visible', timeout: 60000 });
  await wait(400);

  const proto = String(Date.now()).slice(-7);
  const logradouro = `Doc captura automática ${proto}`;

  await protoIn.fill(proto, { timeout: 60000 });
  const endIn = idPage.locator('ion-input[placeholder="Endereço ou Local"] input.native-input');
  await endIn.fill(logradouro, { timeout: 60000 });

  await shot(page, '09-identificacao.png');

  await page.locator('ion-footer ion-button.submit-btn').click();
  await page.waitForURL(/atendimento\/visualizar/, { timeout: 120000 });
  await wait(2200);
}

async function tour() {
  if (!fs.existsSync(SESSION_MARKER)) {
    console.error(`
══════════════════════════════════════════════════════════════
 FALTA SESSÃO GRAVADA (perfil Chromium)
══════════════════════════════════════════════════════════════
 O Firebase Auth usa IndexedDB; o tour abre um perfil em disco
 (.auth/playwright-profile), não só um ficheiro JSON.

   cd docs/manual
   npm run screenshots:login

 Depois:

   npm run screenshots

 (Se tinha apenas .auth/storage.json antigo, faça login outra vez.)
══════════════════════════════════════════════════════════════
`);
    process.exit(1);
  }

  await mkdirp(OUT);

  const tourOpts = {
    ...getPersistentContextOptions(),
    headless: process.env.LAWDO_SCREENSHOT_HEADLESS === '1',
    slowMo: Number(process.env.LAWDO_SLOW_MO || 0),
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, tourOpts);
  } catch (e) {
    console.warn('Aviso: launchPersistentContext com «chrome» falhou; a tentar Chromium…', (e && e.message) || e);
    const { channel, ...rest } = tourOpts;
    context = await chromium.launchPersistentContext(PERSISTENT_PROFILE_DIR, rest);
  }

  const page = context.pages()[0] ?? (await context.newPage());

  try {
    await page.goto(`${BASE}/home`, { waitUntil: 'load', timeout: 120000 });
    await waitForHomeLoggedIn(page);
    await wait(POST_LOGIN_SETTLE_MS > 0 ? POST_LOGIN_SETTLE_MS : 1800);
    await shot(page, '01-inicio.png');

    const menuBtn = page.locator('ion-menu-button');
    if (await menuBtn.isVisible({ timeout: 30000 }).catch(() => false)) {
      await menuBtn.click();
      await wait(900);
      await shot(page, '02-menu-aberto.png');
      await page.keyboard.press('Escape').catch(() => {});
      await wait(400);
    }

    await page.goto(`${BASE}/perfil`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await wait(1600);
    await shot(page, '03-conta.png');

    await page.goto(`${BASE}/configuracoes`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await wait(1600);
    await shot(page, '04-configuracoes.png');

    /** Corporações / Órgãos (`05`, `06`) omitidas do tour — gerar manualmente se precisar. */

    /** `networkidle` aqui trava com `ionic serve`/`ng serve`: ligação WebSocket mantém rede «activa». */
    await page.goto(`${BASE}/atendimentos`, { waitUntil: 'load', timeout: 120000 });
    await waitForAtendimentosListFirstPage(page);
    await wait(800);
    await shot(page, '07-atendimentos.png');

    await fillIdentificacao(page);
    await shot(page, '08-atendimento-hub.png');

    await openFromHub(page, 'Requisição', '10-requisicao.png');
    await clickFirstBack(page);

    await openFromHub(page, 'Local', '11-local.png');
    await clickFirstBack(page);

    await openFromHub(page, 'Preservação e Isolamento', '12-preservacao.png');
    await clickFirstBack(page);

    await openFromHub(page, 'Vítima(s)', '13-vitimas.png');

    await page.getByRole('button', { name: /^Adicionar$/ }).click();
    await wait(2800);
    await shot(page, '14-vitima.png');

    await page.locator('.img-container ion-item').first().click();
    await wait(3500);
    await shot(page, '15-mapa-ferimentos.png');

    await page.getByRole('button', { name: /^Fechar$/ }).first().click();
    await wait(1200);

    await clickFirstBack(page);
    await wait(800);
    await clickFirstBack(page);

    await ensureHub(page);

    await openFromHub(page, 'Veículo(s)', '16-veiculos.png');

    await page.getByRole('button', { name: /^Adicionar$/ }).click();
    await wait(2800);
    await shot(page, '17-veiculo.png');
    await clickFirstBack(page);

    await ensureHub(page);

    await openFromHub(page, 'Vestígios', '18-vestigios.png');

    await page.getByRole('button', { name: /Cadastrar vestígio/i }).click();
    await wait(2200);
    await shot(page, '19-vestigio-formulario.png');
    await page.locator('[aria-label="Fechar"]').first().click();
    await wait(800);
    await clickFirstBack(page);

    await ensureHub(page);

    await openFromHub(page, 'Imagens', '20-imagens-aberta.png');

    const tinyPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const tmpImg = path.join(OUT, '_tiny.png');
    fs.writeFileSync(tmpImg, Buffer.from(tinyPng, 'base64'));
    await page.locator('#arquivo').setInputFiles(tmpImg);
    await wait(4500);
    await shot(page, '20-imagens.png');

    await page.locator('.img-preview').first().click({ timeout: 15000 }).catch(() => {});
    await wait(3500);
    await shot(page, '21-imagem-editor.png');
    await clickFirstBack(page);

    await ensureHub(page);

    await openFromHub(page, 'Dinâmica e Conclusão', '22-dinamica-conclusao.png');
    await clickFirstBack(page);

    await openFromHub(page, 'Laudo', '23-laudo.png');

    console.log('\nConcluído. Imagens em:', OUT);
  } finally {
    await context.close();
  }
}

const isLogin = process.argv.includes('--login');
if (isLogin) {
  await loginFlow();
} else {
  await tour();
}
