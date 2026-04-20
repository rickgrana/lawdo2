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
const OUT = path.join(MANUAL_ROOT, 'images', 'telas', 'capturas');
const BASE = process.env.LAWDO_BASE_URL || 'http://127.0.0.1:4200';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function mkdirp(d) {
  await fs.promises.mkdir(d, { recursive: true });
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('OK', file);
}

async function loginFlow() {
  await mkdirp(path.dirname(AUTH));
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 120000 });
  console.log('\n>>> Faça login (ENTRAR → Google).\n>>> Esperando até 3 minutos pelo botão Atendimentos...\n');
  await page.getByRole('button', { name: /Atendimentos/i }).waitFor({ state: 'visible', timeout: 180000 });
  await context.storageState({ path: AUTH });
  await browser.close();
  console.log('Estado gravado em:', AUTH);
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
  await page.goto(`${BASE}/atendimento/identificacao`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await wait(2800);

  const proto = String(Date.now()).slice(-7);
  const logradouro = `Doc captura automática ${proto}`;

  await page.locator('ion-input.input-protocolo input').fill(proto);
  const endIn = page.locator('input[placeholder="Endereço ou Local"]');
  await endIn.fill(logradouro);

  await shot(page, '09-identificacao.png');

  await page.locator('ion-footer ion-button.submit-btn').click();
  await page.waitForURL(/atendimento\/visualizar/, { timeout: 120000 });
  await wait(2200);
}

async function tour() {
  if (!fs.existsSync(AUTH)) {
    console.error('Falta sessão gravada. Execute: npm run screenshots:login');
    process.exit(1);
  }

  await mkdirp(OUT);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: AUTH,
    viewport: { width: 1280, height: 900 },
    locale: 'pt-BR',
  });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1800);
    await shot(page, '01-inicio.png');

    const menuBtn = page.locator('ion-menu-button');
    if (await menuBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await menuBtn.click();
      await wait(900);
      await shot(page, '02-menu-aberto.png');
      await page.keyboard.press('Escape').catch(() => {});
      await wait(400);
    }

    await page.goto(`${BASE}/perfil`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1600);
    await shot(page, '03-conta.png');

    await page.goto(`${BASE}/configuracoes`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1600);
    await shot(page, '04-configuracoes.png');

    await page.goto(`${BASE}/corporacao/gerenciar`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1600);
    await shot(page, '05-corporacoes.png');

    await page.goto(`${BASE}/orgao/gerenciar`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1600);
    await shot(page, '06-orgaos.png');

    await page.goto(`${BASE}/atendimentos`, { waitUntil: 'networkidle', timeout: 120000 });
    await wait(1600);
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
    await browser.close();
  }
}

const isLogin = process.argv.includes('--login');
if (isLogin) {
  await loginFlow();
} else {
  await tour();
}
