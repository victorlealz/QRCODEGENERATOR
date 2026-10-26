'use strict';

const CONFIG = Object.freeze({
  logoPath: 'assets/logo.png',
  fileName: 'qr-code-institucional',
  quietZoneModules: 4,
  logoWidthRatio: 0.18,
  logoPaddingRatio: 0.018,
  qrColor: '#000000',
  backgroundColor: '#ffffff'
});

const form = document.getElementById('qr-form');
const urlInput = document.getElementById('url-input');
const sizeSelect = document.getElementById('size-select');
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
let logoDataUrl = '';

const logoImage = new Image();
logoImage.decoding = 'async';

const logoReady = new Promise((resolve, reject) => {
  const finishLoad = () => {
    try {
      if (!logoImage.naturalWidth || !logoImage.naturalHeight) {
        throw new Error('A logo institucional foi carregada, mas a imagem é inválida.');
      }
      logoDataUrl = imageToDataUrl(logoImage);
      resolve();
    } catch (error) {
      reject(error);
    }
  };

  logoImage.addEventListener('load', finishLoad, { once: true });
  logoImage.addEventListener('error', () => {
    reject(new Error(`Falha ao carregar a logo institucional em ${CONFIG.logoPath}.`));
  }, { once: true });

  // Registra os eventos antes de iniciar o carregamento para evitar perder
  // o evento "load" quando a imagem já estiver em cache.
  logoImage.src = CONFIG.logoPath;

  if (logoImage.complete && logoImage.naturalWidth > 0) {
    finishLoad();
  }
});

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

urlInput.addEventListener('input', () => {
  urlInput.removeAttribute('aria-invalid');
  clearStatus();
});

async function generateQrCode() {
  clearStatus();

  const normalizedUrl = getValidatedUrl();
  if (!normalizedUrl) return;

  try {
    await logoReady;

    currentSize = Number(sizeSelect.value);
    currentQr = createQr(normalizedUrl);
    currentCanvas = renderCanvas(currentQr, currentSize, logoImage);

    canvasWrap.replaceChildren(currentCanvas);
    result.hidden = false;

    // A rolagem é apenas um detalhe de interface e nunca deve invalidar um QR
    // que já foi gerado com sucesso.
    try {
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      // Navegadores antigos podem não aceitar as opções de scrollIntoView.
    }
  } catch (error) {
    console.error('[Gerador QR] Falha ao gerar QR Code:', error);
    currentQr = null;
    currentCanvas = null;
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

function renderCanvas(qr, size, image) {
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

  drawLogo(ctx, size, image);
  return canvas;
}

function drawLogo(ctx, size, image) {
  const logoSize = Math.round(size * CONFIG.logoWidthRatio);
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
  result.hidden = true;
  canvasWrap.replaceChildren();
  urlInput.removeAttribute('aria-invalid');
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
  if (!currentQr || !logoDataUrl) return;

  const svg = buildSvg(currentQr, logoDataUrl);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  downloadBlob(blob, `${CONFIG.fileName}.svg`);
}

function buildSvg(qr, embeddedLogo) {
  const moduleCount = qr.getModuleCount();
  const quiet = CONFIG.quietZoneModules;
  const total = moduleCount + quiet * 2;
  const logoSize = total * CONFIG.logoWidthRatio;
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

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">`,
    '<title>QR Code institucional</title>',
    '<defs>',
    `<clipPath id="${clipId}"><circle cx="${center}" cy="${center}" r="${logoSize / 2}"/></clipPath>`,
    '</defs>',
    `<rect width="${total}" height="${total}" fill="${CONFIG.backgroundColor}"/>`,
    `<path d="${path}" fill="${CONFIG.qrColor}"/>`,
    `<circle cx="${center}" cy="${center}" r="${whiteRadius}" fill="${CONFIG.backgroundColor}"/>`,
    `<image href="${embeddedLogo}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`,
    '</svg>'
  ].join('');
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
  if (/logo institucional/i.test(message)) {
    return 'Não foi possível carregar a logo. Verifique o arquivo assets/logo.png.';
  }
  if (/Canvas/i.test(message)) {
    return 'O navegador não conseguiu renderizar o QR Code em Canvas.';
  }
  if (/SecurityError|tainted|cross-origin/i.test(message)) {
    return 'O navegador bloqueou o uso da logo por uma restrição de segurança.';
  }

  return `Não foi possível gerar o QR Code. Detalhe: ${message}`;
}
