'use strict';

const CONFIG = Object.freeze({
  logoPath: 'assets/logo.png',
  mapLogoPath: 'assets/map.png',
  fileName: 'qr-code-institucional',
  quietZoneModules: 4,
  logoWidthRatio: 0.18,
  logoPaddingRatio: 0.018,
  qrColor: '#000000',
  backgroundColor: '#ffffff'
});

const ALLOWED_UPLOAD_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml'
]);

const ALLOWED_UPLOAD_EXTENSIONS = /\.(png|jpe?g|webp|svg)$/i;

const form = document.getElementById('qr-form');
const urlInput = document.getElementById('url-input');
const sizeSelect = document.getElementById('size-select');
const logoSelect = document.getElementById('logo-select');
const customLogoOptions = document.getElementById('custom-logo-options');
const customLogoSource = document.getElementById('custom-logo-source');
const customLogoFile = document.getElementById('custom-logo-file');
const customLogoUrl = document.getElementById('custom-logo-url');
const customLogoSize = document.getElementById('custom-logo-size');
const customLogoSizeValue = document.getElementById('custom-logo-size-value');
const customLogoUploadPanel = document.getElementById('custom-logo-upload-panel');
const customLogoUrlPanel = document.getElementById('custom-logo-url-panel');
const copyButton = document.getElementById('copy-button');
const clearButton = document.getElementById('clear-button');
const status = document.getElementById('form-status');
const result = document.getElementById('qr-result');
const canvasWrap = document.getElementById('qr-canvas-wrap');
const downloadPngButton = document.getElementById('download-png');
const downloadSvgButton = document.getElementById('download-svg');

let currentQr = null;
let currentCanvas = null;
let currentSize = 500;
let currentLogoDataUrl = '';
let currentLogoWidthRatio = CONFIG.logoWidthRatio;
let customUploadedLogo = null;

const imageCache = new Map();
const logoReady = loadImageResource(CONFIG.logoPath, false, 'Logo DECC');
const mapLogoReady = loadImageResource(CONFIG.mapLogoPath, false, 'logo de mapa');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await generateQrCode();
});

copyButton.addEventListener('click', copyUrl);
clearButton.addEventListener('click', clearAll);
downloadPngButton.addEventListener('click', downloadPng);
downloadSvgButton.addEventListener('click', downloadSvg);

sizeSelect.addEventListener('change', async () => {
  if (currentQr) {
    await generateQrCode();
  }
});

logoSelect.addEventListener('change', async () => {
  updateLogoControls();
  clearStatus();
  if (currentQr && logoSelect.value !== 'custom') {
    await generateQrCode();
  }
});

customLogoSource.addEventListener('change', () => {
  updateLogoControls();
  clearStatus();
});

customLogoFile.addEventListener('change', async () => {
  clearStatus();
  customUploadedLogo = null;

  const file = customLogoFile.files && customLogoFile.files[0];
  if (!file) return;

  try {
    customUploadedLogo = await loadUploadedLogo(file);
    if (currentQr && logoSelect.value === 'custom' && customLogoSource.value === 'upload') {
      await generateQrCode();
    }
  } catch (error) {
    customLogoFile.value = '';
    setStatus(toUserMessage(error), false);
  }
});

customLogoUrl.addEventListener('input', () => {
  customLogoUrl.removeAttribute('aria-invalid');
  clearStatus();
});

customLogoSize.addEventListener('input', async () => {
  updateCustomLogoSizeLabel();
  if (currentQr && logoSelect.value === 'custom') {
    await generateQrCode();
  }
});

urlInput.addEventListener('input', () => {
  urlInput.removeAttribute('aria-invalid');
  clearStatus();
});

updateLogoControls();
updateCustomLogoSizeLabel();

async function generateQrCode() {
  clearStatus();

  const normalizedUrl = getValidatedUrl();
  if (!normalizedUrl) return;

  try {
    const selectedLogo = await resolveSelectedLogo();

    currentSize = Number(sizeSelect.value);
    currentQr = createQr(normalizedUrl);
    currentLogoDataUrl = selectedLogo ? selectedLogo.dataUrl : '';
    currentLogoWidthRatio = getSelectedLogoWidthRatio();
    currentCanvas = renderCanvas(
      currentQr,
      currentSize,
      selectedLogo ? selectedLogo.image : null,
      currentLogoWidthRatio
    );

    canvasWrap.replaceChildren(currentCanvas);
    result.hidden = false;

    try {
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      // Navegadores antigos podem não aceitar as opções de scrollIntoView.
    }
  } catch (error) {
    console.error('[Gerador QR] Falha ao gerar QR Code:', error);
    currentQr = null;
    currentCanvas = null;
    currentLogoDataUrl = '';
    currentLogoWidthRatio = CONFIG.logoWidthRatio;
    result.hidden = true;
    canvasWrap.replaceChildren();
    setStatus(toUserMessage(error), false);
  }
}

function createQr(data) {
  if (typeof window.QRCodeGenerator !== 'function' || !window.QRErrorCorrectLevel) {
    throw new Error('Biblioteca de QR Code indisponível.');
  }

  const qr = new window.QRCodeGenerator(0, window.QRErrorCorrectLevel.H);
  qr.addData(data);
  qr.make();
  return qr;
}

function renderCanvas(qr, size, image, logoWidthRatio = CONFIG.logoWidthRatio) {
  const moduleCount = qr.getModuleCount();
  const quiet = CONFIG.quietZoneModules;
  const totalModules = moduleCount + quiet * 2;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'QR Code gerado');

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('O navegador não disponibilizou o recurso de desenho em Canvas.');
  }
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = CONFIG.qrColor;

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!qr.isDark(row, col)) continue;

      const x0 = Math.floor(((col + quiet) * size) / totalModules);
      const y0 = Math.floor(((row + quiet) * size) / totalModules);
      const x1 = Math.ceil(((col + quiet + 1) * size) / totalModules);
      const y1 = Math.ceil(((row + quiet + 1) * size) / totalModules);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }

  if (image) {
    drawLogo(ctx, size, image, logoWidthRatio);
  }
  return canvas;
}

function drawLogo(ctx, size, image, logoWidthRatio = CONFIG.logoWidthRatio) {
  if (!image) return;

  const logoSize = Math.round(size * logoWidthRatio);
  const padding = Math.max(5, Math.round(size * CONFIG.logoPaddingRatio));
  const center = size / 2;
  const backgroundRadius = logoSize / 2 + padding;

  ctx.save();
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.beginPath();
  ctx.arc(center, center, backgroundRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(center, center, logoSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(
    image,
    center - logoSize / 2,
    center - logoSize / 2,
    logoSize,
    logoSize
  );
  ctx.restore();
}

function getValidatedUrl() {
  const raw = urlInput.value.trim();

  if (!raw) {
    invalidateUrl('Informe uma URL.');
    return null;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    invalidateUrl('Informe uma URL válida.');
    return null;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    invalidateUrl('Use uma URL iniciada por http:// ou https://.');
    return null;
  }

  if (!parsed.hostname) {
    invalidateUrl('Informe uma URL válida.');
    return null;
  }

  urlInput.removeAttribute('aria-invalid');
  return parsed.href;
}

function invalidateUrl(message) {
  urlInput.setAttribute('aria-invalid', 'true');
  urlInput.focus();
  setStatus(message, false);
}

async function resolveSelectedLogo() {
  switch (logoSelect.value) {
    case 'decc':
      return logoReady;
    case 'none':
      return null;
    case 'map':
      return mapLogoReady;
    case 'custom':
      return resolveCustomLogo();
    default:
      return logoReady;
  }
}

async function resolveCustomLogo() {
  if (customLogoSource.value === 'upload') {
    if (!customUploadedLogo) {
      throw new Error('Selecione uma imagem para usar como logo personalizada.');
    }
    return customUploadedLogo;
  }

  const rawUrl = customLogoUrl.value.trim();
  if (!rawUrl) {
    customLogoUrl.setAttribute('aria-invalid', 'true');
    customLogoUrl.focus();
    throw new Error('Informe a URL da imagem no FlatIcon.');
  }

  const imageUrl = normalizeFlaticonImageUrl(rawUrl);
  customLogoUrl.removeAttribute('aria-invalid');
  return loadImageResource(imageUrl, true, 'logo personalizada do FlatIcon');
}

function normalizeFlaticonImageUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Informe uma URL válida do FlatIcon.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('A URL do FlatIcon deve começar com https://.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'flaticon.com' && !hostname.endsWith('.flaticon.com')) {
    throw new Error('Use uma URL pertencente ao domínio flaticon.com.');
  }

  const iconIdMatch = parsed.pathname.match(/_(\d+)(?:\.[a-z0-9]+)?(?:\/)?$/i);
  const isFlaticonPage = hostname === 'flaticon.com' || hostname === 'www.flaticon.com';

  if (isFlaticonPage && iconIdMatch) {
    const iconId = Number(iconIdMatch[1]);
    const folder = Math.floor(iconId / 1000);
    return `https://cdn-icons-png.flaticon.com/512/${folder}/${iconId}.png`;
  }

  if (/\.(png|jpe?g|webp|svg)$/i.test(parsed.pathname)) {
    return parsed.href;
  }

  throw new Error('Use a página de um ícone do FlatIcon ou uma URL direta de imagem PNG, JPG, WEBP ou SVG do FlatIcon.');
}

function updateLogoControls() {
  const isCustom = logoSelect.value === 'custom';
  const isUrl = customLogoSource.value === 'url';

  customLogoOptions.hidden = !isCustom;
  customLogoUploadPanel.hidden = !isCustom || isUrl;
  customLogoUrlPanel.hidden = !isCustom || !isUrl;
}

function getSelectedLogoWidthRatio() {
  if (logoSelect.value !== 'custom') {
    return CONFIG.logoWidthRatio;
  }

  const selectedPercent = Number(customLogoSize.value);
  if (!Number.isFinite(selectedPercent)) {
    return CONFIG.logoWidthRatio;
  }

  return Math.min(0.30, Math.max(0.10, selectedPercent / 100));
}

function updateCustomLogoSizeLabel() {
  customLogoSizeValue.textContent = `${customLogoSize.value}%`;
}

async function loadUploadedLogo(file) {
  const hasAllowedMime = !file.type || ALLOWED_UPLOAD_TYPES.has(file.type);
  const hasAllowedExtension = ALLOWED_UPLOAD_EXTENSIONS.test(file.name);

  if (!hasAllowedMime || !hasAllowedExtension) {
    throw new Error('Use uma imagem PNG, JPG/JPEG, WEBP ou SVG.');
  }

  const dataUrl = await readFileAsDataUrl(file);
  return loadImageResource(dataUrl, false, 'imagem enviada', false);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')), { once: true });
    reader.addEventListener('error', () => reject(new Error('Não foi possível ler a imagem enviada.')), { once: true });
    reader.readAsDataURL(file);
  });
}

function loadImageResource(src, useCors, label, useCache = true) {
  const cacheKey = `${useCors ? 'cors' : 'local'}:${src}`;
  if (useCache && imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    if (useCors) {
      image.crossOrigin = 'anonymous';
    }

    image.addEventListener('load', () => {
      try {
        if (!image.naturalWidth || !image.naturalHeight) {
          throw new Error(`A ${label} foi carregada, mas a imagem é inválida.`);
        }
        resolve({
          image,
          dataUrl: imageToDataUrl(image)
        });
      } catch (error) {
        reject(error);
      }
    }, { once: true });

    image.addEventListener('error', () => {
      reject(new Error(`Falha ao carregar a ${label}.`));
    }, { once: true });

    image.src = src;
  });

  if (useCache) {
    imageCache.set(cacheKey, promise);
    promise.catch(() => imageCache.delete(cacheKey));
  }

  return promise;
}

async function copyUrl() {
  clearStatus();
  const normalizedUrl = getValidatedUrl();
  if (!normalizedUrl) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(normalizedUrl);
    } else {
      fallbackCopy(normalizedUrl);
    }
    setStatus('URL copiada.', true);
  } catch {
    setStatus('Não foi possível copiar a URL.', false);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Cópia não suportada.');
  }
}

function clearAll() {
  form.reset();
  currentQr = null;
  currentCanvas = null;
  currentSize = 500;
  currentLogoDataUrl = '';
  currentLogoWidthRatio = CONFIG.logoWidthRatio;
  customUploadedLogo = null;
  result.hidden = true;
  canvasWrap.replaceChildren();
  urlInput.removeAttribute('aria-invalid');
  customLogoUrl.removeAttribute('aria-invalid');
  updateLogoControls();
  updateCustomLogoSizeLabel();
  clearStatus();
  urlInput.focus();
}

function downloadPng() {
  if (!currentCanvas) return;

  if (currentCanvas.toBlob) {
    currentCanvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${CONFIG.fileName}.png`);
    }, 'image/png');
    return;
  }

  const link = document.createElement('a');
  link.download = `${CONFIG.fileName}.png`;
  link.href = currentCanvas.toDataURL('image/png');
  link.click();
}

function downloadSvg() {
  if (!currentQr) return;

  const svg = buildSvg(currentQr, currentLogoDataUrl, currentLogoWidthRatio);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${CONFIG.fileName}.svg`);
}

function buildSvg(qr, embeddedLogo, logoWidthRatio = CONFIG.logoWidthRatio) {
  const moduleCount = qr.getModuleCount();
  const quiet = CONFIG.quietZoneModules;
  const total = moduleCount + quiet * 2;
  const logoSize = total * logoWidthRatio;
  const padding = total * CONFIG.logoPaddingRatio;
  const center = total / 2;
  const logoX = center - logoSize / 2;
  const logoY = center - logoSize / 2;
  const whiteRadius = logoSize / 2 + padding;
  const clipId = 'logo-circle';

  let path = '';
  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }

  const svgParts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    '<title>QR Code</title>'
  ];

  if (embeddedLogo) {
    svgParts.push(
      '<defs>',
      `<clipPath id="${clipId}"><circle cx="${center}" cy="${center}" r="${logoSize / 2}"/></clipPath>`,
      '</defs>'
    );
  }

  svgParts.push(
    `<rect width="${total}" height="${total}" fill="${CONFIG.backgroundColor}"/>`,
    `<path d="${path}" fill="${CONFIG.qrColor}"/>`
  );

  if (embeddedLogo) {
    svgParts.push(
      `<circle cx="${center}" cy="${center}" r="${whiteRadius}" fill="${CONFIG.backgroundColor}"/>`,
      `<image href="${embeddedLogo}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`
    );
  }

  svgParts.push('</svg>');
  return svgParts.join('');
}

function imageToDataUrl(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('O navegador não disponibilizou o recurso de desenho em Canvas.');
  }
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

function downloadBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function setStatus(message, success) {
  status.textContent = message;
  status.classList.toggle('success', Boolean(success));
}

function clearStatus() {
  status.textContent = '';
  status.classList.remove('success');
}

function toUserMessage(error) {
  const message = error instanceof Error ? error.message : String(error);

  if (/code length overflow/i.test(message)) {
    return 'A URL é longa demais para gerar este QR Code.';
  }
  if (/Biblioteca de QR Code indisponível/i.test(message)) {
    return 'Biblioteca de QR Code não carregada. Verifique o arquivo vendor/qrcode-generator.js.';
  }
  if (/Logo DECC|assets\/logo\.png/i.test(message)) {
    return 'Não foi possível carregar a Logo DECC. Verifique o arquivo assets/logo.png.';
  }
  if (/logo de mapa|assets\/map\.png/i.test(message)) {
    return 'Não foi possível carregar o símbolo de mapa. Verifique o arquivo assets/map.png.';
  }
  if (/Selecione uma imagem|URL da imagem|URL válida do FlatIcon|domínio flaticon\.com|página de um ícone|imagem PNG|imagem enviada/i.test(message)) {
    return message;
  }
  if (/Falha ao carregar a logo personalizada/i.test(message)) {
    return 'Não foi possível carregar a imagem do FlatIcon. Confirme se o endereço é público e se o servidor permite o uso da imagem no navegador.';
  }
  if (/Canvas/i.test(message)) {
    return 'O navegador não conseguiu renderizar o QR Code em Canvas.';
  }
  if (/SecurityError|tainted|cross-origin/i.test(message)) {
    return 'O navegador bloqueou o uso da imagem por uma restrição de segurança do servidor de origem.';
  }

  return `Não foi possível gerar o QR Code. Detalhe: ${message}`;
}
