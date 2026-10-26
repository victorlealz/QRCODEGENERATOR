# Gerador Institucional de QR Code

Aplicação web estática, responsiva e sem backend para gerar QR Codes de URLs com a logomarca institucional centralizada.

O QR Code é criado integralmente no navegador. A URL informada não é enviada para APIs, servidores externos, bancos de dados, serviços de analytics ou trackers.

## Funcionalidades

- geração local de QR Code para URLs `http://` e `https://`;
- correção de erro nível **H**;
- logo institucional circular no centro;
- margem de segurança (quiet zone) de 4 módulos;
- tamanhos de 300, 500, 800 e 1000 pixels;
- download em PNG;
- download em SVG com a logo incorporada ao próprio arquivo;
- cópia da URL para a área de transferência;
- validação de URL;
- interface responsiva para desktop e dispositivos móveis;
- navegação por teclado e mensagens acessíveis;
- política CSP e cabeçalhos de segurança para Cloudflare Pages;
- nenhum processo de build.

## Tecnologias

- HTML5;
- CSS3;
- JavaScript moderno;
- **QRCode for JavaScript**, de Kazuhiko Arase, licenciado sob MIT e incluído localmente em `vendor/qrcode-generator.js`.

A biblioteca `qr-code-styling` foi considerada, mas o projeto usa um encoder QR menor incorporado ao repositório para manter a aplicação totalmente autocontida, sem CDN e sem dependência de build. A renderização da logo, PNG e SVG é feita pelo próprio `script.js`.

## Estrutura

```text
gerador-qr-institucional/
├── index.html
├── styles.css
├── script.js
├── _headers
├── .gitignore
├── LICENSE
├── README.md
├── THIRD_PARTY_NOTICES.md
├── assets/
│   ├── logo.png
│   └── logo-original.png
└── vendor/
    ├── qrcode-generator.js
    ├── LICENSE-qrcode-generator.txt
    └── LICENSE-qrcode-terminal.txt
```

## Logo institucional

A logo utilizada pelo QR Code está em:

```text
assets/logo.png
```

O arquivo `assets/logo-original.png` preserva a imagem original fornecida.

A versão `assets/logo.png` foi recortada e preparada em formato circular, eliminando a grande margem preta da imagem original para melhorar a leitura do QR Code.

### Trocar a logo

1. Substitua `assets/logo.png` por outra imagem PNG quadrada.
2. Mantenha o mesmo nome de arquivo.
3. Prefira fundo transparente fora do símbolo circular.
4. Para alterar o caminho, edite em `script.js`:

```js
logoPath: 'assets/logo.png'
```

A logo ocupa 18% da largura do QR Code e recebe uma pequena área branca de proteção. Esses valores podem ser alterados em `script.js`:

```js
logoWidthRatio: 0.18,
logoPaddingRatio: 0.018,
```

Para leitura confiável, evite aumentar excessivamente a logo.

## Alterar cores

As cores da interface ficam no início de `styles.css`:

```css
:root {
  --blue: #0a4f93;
  --blue-dark: #073867;
  --black: #0b0d10;
  --white: #ffffff;
}
```

As cores do QR Code ficam no início de `script.js`:

```js
qrColor: '#000000',
backgroundColor: '#ffffff'
```

Para preservar a leitura, recomenda-se manter o QR Code preto sobre fundo branco.

## Alterar o título

No arquivo `index.html`, altere:

```html
<title>Gerador de QR Code</title>
```

E o título visível:

```html
<h1>Gerador de QR Code</h1>
```

O rodapé também pode ser alterado diretamente em `index.html`:

```html
<footer class="footer">Gerador Institucional de QR Code</footer>
```

## Nome da instituição

O layout foi deixado intencionalmente sem nome institucional, exibindo somente a logo e o título. Para adicionar o nome, insira o texto desejado dentro do elemento `.brand` em `index.html` ou substitua o conteúdo do `<h1>`.

## Executar localmente

Por segurança dos navegadores, prefira abrir o projeto por um servidor HTTP local em vez de clicar diretamente no arquivo HTML.

Com Python:

```bash
python3 -m http.server 8080
```

Depois acesse:

```text
http://localhost:8080
```

Também é possível usar qualquer servidor estático local.

## Publicar no GitHub

Crie um repositório vazio no GitHub e, dentro da pasta do projeto, execute:

```bash
git init
git add .
git commit -m "Publica gerador institucional de QR Code"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Também é possível enviar os arquivos pela interface web do GitHub.

## Publicar no Cloudflare Pages

A documentação atual do Cloudflare Pages permite conectar um repositório GitHub e publicar sites HTML estáticos sem framework e sem etapa real de build.

1. Entre no painel do Cloudflare.
2. Abra **Workers & Pages**.
3. Selecione **Create application**.
4. Selecione **Pages**.
5. Escolha **Import an existing Git repository**.
6. Autorize o GitHub, se necessário.
7. Selecione o repositório deste projeto.
8. Configure:

```text
Production branch: main
Framework preset: None
Build command: exit 0
Build output directory: .
Root directory: deixar em branco
```

Também é possível deixar o campo **Build command** em branco em projetos sem framework. O comando `exit 0` é uma opção recomendada pela documentação do Cloudflare para projetos estáticos sem processo de build.

9. Inicie o deploy.

O site receberá um endereço semelhante a:

```text
https://nome-do-projeto.pages.dev
```

A cada novo `git push` na branch `main`, o Cloudflare Pages poderá publicar automaticamente a nova versão.

Documentação oficial:

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/build-configuration/

## Como funciona

1. O navegador valida a URL com a API nativa `URL`.
2. O encoder local gera a matriz do QR Code com correção de erro nível H.
3. O JavaScript desenha os módulos pretos com quiet zone de 4 módulos.
4. Uma área branca circular protege a região central.
5. A logo é desenhada no centro com 18% da largura do QR Code.
6. O PNG é exportado do `<canvas>`.
7. O SVG é construído localmente, incorporando a logo como `data:` para que o arquivo seja independente.

Nenhuma etapa envia a URL para a internet.

## Segurança e privacidade

O arquivo `_headers` adiciona cabeçalhos para Cloudflare Pages, incluindo:

- Content Security Policy;
- bloqueio de framing;
- `Referrer-Policy: no-referrer`;
- `X-Content-Type-Options: nosniff`;
- bloqueio de permissões desnecessárias.

A política `connect-src 'none'` impede o JavaScript da página de realizar conexões de rede por `fetch`, XHR ou WebSocket.

## Compatibilidade

O projeto utiliza APIs amplamente suportadas por navegadores modernos:

- Google Chrome;
- Microsoft Edge;
- Firefox;
- Safari;
- Android;
- iPhone e iPad.

A cópia para a área de transferência usa a Clipboard API em contexto HTTPS e possui fallback para navegadores compatíveis mais antigos.

## Licença

O código deste projeto está sob licença MIT. Consulte `LICENSE`.

O encoder QR incluído em `vendor/` deriva do código QRCode for JavaScript (MIT) distribuído pelo pacote `qrcode-terminal`, cujas modificações e distribuição também são cobertas pela licença Apache 2.0. Consulte os arquivos de licença em `vendor/` e `THIRD_PARTY_NOTICES.md`.

A logomarca institucional é um ativo separado e não é automaticamente relicenciada pela licença MIT do código. Verifique as regras internas de uso da identidade visual antes de redistribuí-la.

## Diagnóstico de erros

A versão corrigida informa a causa real quando a geração falha. Os dois arquivos essenciais que devem existir exatamente nestes caminhos são:

```text
assets/logo.png
vendor/qrcode-generator.js
```

Se a aplicação estiver publicada em uma subpasta, mantenha `index.html`, `script.js`, `styles.css`, `assets/` e `vendor/` juntos na mesma raiz publicada.

No Cloudflare Pages, confirme que o diretório de saída contém diretamente o `index.html`. Se o repositório tiver uma pasta externa envolvendo todo o projeto, configure essa pasta como **Root directory**, ou mova o conteúdo do projeto para a raiz do repositório.
