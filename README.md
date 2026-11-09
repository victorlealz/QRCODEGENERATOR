# Gerador de QR CODE WinZip144

Aplicação web estática, responsiva e sem backend para gerar QR Codes de URLs, com opção de usar a Logo DECC, gerar sem logo, usar um símbolo de mapa ou inserir uma imagem personalizada.

O QR Code é criado integralmente no navegador. A URL informada para ser convertida em QR Code não é enviada para APIs, servidores externos, bancos de dados, serviços de analytics ou trackers. Quando o usuário escolhe uma logo personalizada por URL do FlatIcon, somente a imagem escolhida é carregada do domínio do FlatIcon.

## Funcionalidades

- geração local de QR Code para URLs `http://` e `https://`;
- correção de erro nível **H**;
- **Logo DECC** (`assets/logo.png`) aplicada por padrão no centro do QR Code;
- opção de gerar QR Code **sem logo**;
- opção fixa de QR Code com símbolo de **Mapa** (`assets/map.png`), baseada no recurso indicado do FlatIcon;
- opção de imagem personalizada por **upload** em PNG, JPG/JPEG, WEBP ou SVG;
- opção de imagem personalizada por **URL do FlatIcon**, aceitando tanto a página do ícone quanto uma URL direta de imagem hospedada em domínio do FlatIcon;
- controle deslizante de **tamanho da imagem personalizada**, de 10% a 30% da largura do QR Code, aplicável tanto a upload quanto a URL;
- pequena logo de QR Code (`assets/qr-code.png`) à esquerda do título da página;
- margem de segurança (quiet zone) de 4 módulos;
- tamanhos de 300, 500, 800 e 1000 pixels;
- download em PNG;
- download em SVG com a logo escolhida incorporada ao próprio arquivo, quando houver logo;
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

A biblioteca `qr-code-styling` foi considerada, mas o projeto usa um encoder QR menor incorporado ao repositório para manter a aplicação autocontida, sem CDN para a biblioteca de QR Code e sem dependência de build. A renderização da logo, PNG e SVG é feita pelo próprio `script.js`.

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
│   ├── logo-original.png
│   ├── map.png
│   └── qr-code.png
└── vendor/
    ├── qrcode-generator.js
    ├── LICENSE-qrcode-generator.txt
    └── LICENSE-qrcode-terminal.txt
```

## Logo institucional

A **Logo DECC**, usada por padrão no QR Code, está em:

```text
assets/logo.png
```

O arquivo `assets/logo-original.png` preserva a imagem original fornecida.

A versão `assets/logo.png` foi recortada e preparada em formato circular, eliminando a grande margem preta da imagem original para melhorar a leitura do QR Code.

O seletor **Logo do QR Code** oferece quatro opções:

1. **Logo DECC** — opção padrão, usando `assets/logo.png`;
2. **Sem logo** — gera o QR Code sem imagem central e sem a área branca reservada à logo;
3. **Mapa** — usa `assets/map.png`;
4. **Personalizada** — permite escolher uma imagem por upload ou por URL do FlatIcon.

Quando **Personalizada** está selecionada, o controle **Tamanho da imagem** permite modular a imagem central entre **10% e 30%** da largura do QR Code. O valor padrão é **18%**. O ajuste é aplicado tanto às imagens enviadas por upload quanto às carregadas por URL do FlatIcon e também é preservado no download SVG.

### Imagem personalizada por upload

São aceitos:

```text
PNG
JPG/JPEG
WEBP
SVG
```

A imagem é lida diretamente pelo navegador e incorporada ao QR Code gerado.

### Imagem personalizada por URL do FlatIcon

São aceitos dois tipos de endereço:

```text
https://www.flaticon.com/free-icon/map_854878
```

ou uma URL direta de imagem em domínio do FlatIcon, por exemplo:

```text
https://cdn-icons-png.flaticon.com/512/854/854878.png
```

Quando o usuário informa uma página comum de ícone do FlatIcon, o `script.js` identifica o número do recurso e monta o endereço correspondente da imagem PNG no CDN do FlatIcon. Não é realizado `fetch` da página do FlatIcon.

### Trocar a Logo DECC

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
<title>Gerador de QR CODE WinZip144</title>
```

E o título visível:

```html
<h1>Gerador de QR CODE WinZip144</h1>
```

O cabeçalho exibe o título textual acompanhado, à esquerda, por uma pequena logo de QR Code armazenada em:

```text
assets/qr-code.png
```

Essa imagem afeta somente o cabeçalho da página e não altera a Logo DECC usada por padrão dentro do QR Code gerado.

O rodapé também pode ser alterado diretamente em `index.html`.

## Nome da instituição

O layout foi mantido sem nome institucional adicional no cabeçalho. O título **Gerador de QR CODE WinZip144** é exibido ao lado da pequena logo `assets/qr-code.png`. A identidade DECC permanece como logo padrão dentro do QR Code.

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

Para sobrescrever o conteúdo do repositório já existente `victorlealz/QRCODEGENERATOR`, mantenha todos os arquivos e pastas deste pacote na mesma raiz atualmente publicada pelo projeto.

## Publicar no Cloudflare Pages

A documentação do Cloudflare Pages permite conectar um repositório GitHub e publicar sites HTML estáticos sem framework e sem etapa real de build.

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

Também é possível deixar o campo **Build command** em branco em projetos sem framework. O comando `exit 0` é uma opção usada em projetos estáticos sem processo de build.

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
4. O seletor define se o QR Code usará Logo DECC, nenhuma logo, Mapa ou uma imagem personalizada.
5. Quando existe uma logo, uma área branca circular protege a região central. Logo DECC e Mapa mantêm 18% da largura do QR Code; na opção **Personalizada**, o usuário pode ajustar esse tamanho entre 10% e 30%.
6. O controle de tamanho da opção **Personalizada** funciona da mesma forma para upload e URL do FlatIcon.
7. Quando a opção **Sem logo** é usada, o QR Code é renderizado integralmente sem recorte branco central.
8. O PNG é exportado do `<canvas>`.
9. O SVG é construído localmente e incorpora a imagem escolhida como `data:` quando houver logo, respeitando o tamanho personalizado selecionado.
10. Para URLs de páginas do FlatIcon, o número do ícone é convertido localmente para o endereço de imagem do CDN; a URL que será transformada em QR Code continua sem ser enviada para a internet.

## Segurança e privacidade

O arquivo `_headers` adiciona cabeçalhos para Cloudflare Pages, incluindo:

- Content Security Policy;
- bloqueio de framing;
- `Referrer-Policy: no-referrer`;
- `X-Content-Type-Options: nosniff`;
- bloqueio de permissões desnecessárias.

A política mantém `connect-src 'none'`, impedindo o JavaScript da página de realizar conexões de rede por `fetch`, XHR ou WebSocket.

Para permitir a função solicitada de logo personalizada por URL, `img-src` autoriza exclusivamente, além dos recursos locais/data/blob já existentes, imagens HTTPS em subdomínios de `flaticon.com`:

```text
https://*.flaticon.com
```

Essa exceção é usada apenas pelo carregamento de imagem do navegador. A URL convertida em QR Code não é transmitida.

## Compatibilidade

O projeto utiliza APIs amplamente suportadas por navegadores modernos:

- Google Chrome;
- Microsoft Edge;
- Firefox;
- Safari;
- Android;
- iPhone e iPad.

A cópia para a área de transferência usa a Clipboard API em contexto HTTPS e possui fallback para navegadores compatíveis mais antigos.

O uso de uma imagem externa do FlatIcon no PNG/SVG depende de o servidor da imagem permitir seu carregamento pelo navegador com as regras de origem aplicáveis. As páginas padrão do FlatIcon são convertidas para o endereço do CDN utilizado pelo próprio serviço.

## Licença

O código deste projeto está sob licença MIT. Consulte `LICENSE`.

O encoder QR incluído em `vendor/` deriva do código QRCode for JavaScript (MIT) distribuído pelo pacote `qrcode-terminal`, cujas modificações e distribuição também são cobertas pela licença Apache 2.0. Consulte os arquivos de licença em `vendor/` e `THIRD_PARTY_NOTICES.md`.

A logomarca institucional é um ativo separado e não é automaticamente relicenciada pela licença MIT do código. Verifique as regras internas de uso da identidade visual antes de redistribuí-la.

O símbolo de mapa incluído no projeto está associado ao recurso informado do FlatIcon nº 854878. O FlatIcon informa que o recurso gratuito exige atribuição; a referência foi mantida no rodapé da aplicação e detalhada em `THIRD_PARTY_NOTICES.md`.

## Diagnóstico de erros

A aplicação informa a causa quando a geração falha. Os arquivos essenciais que devem existir exatamente nestes caminhos são:

```text
assets/logo.png
assets/map.png
vendor/qrcode-generator.js
```

Se a aplicação estiver publicada em uma subpasta, mantenha `index.html`, `script.js`, `styles.css`, `assets/` e `vendor/` juntos na mesma raiz publicada.

No Cloudflare Pages, confirme que o diretório de saída contém diretamente o `index.html`. Se o repositório tiver uma pasta externa envolvendo todo o projeto, configure essa pasta como **Root directory**, ou mova o conteúdo do projeto para a raiz do repositório.
