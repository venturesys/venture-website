# Site da Venture

Site institucional em React + TypeScript + Vite, publicado na Vercel.

O conteúdo (insights, cases, parceiros e serviços) vive **dentro deste repositório**,
em `src/content`, e as imagens em `public/media`. Não há CMS nem API externa em tempo
de execução: o site é estático e não depende de nenhum serviço para carregar.

## Rodar localmente

```bash
npm install
npm run dev
```

Outros comandos: `npm run build` (produção), `npm run lint`, `npm run preview`.

## Onde as coisas estão

| Caminho | O que é |
|---|---|
| `src/content/index.json` | Índice com o resumo de todos os itens; alimenta as listagens |
| `src/content/items/*.json` | Corpo de cada item, carregado sob demanda |
| `public/media/` | Imagens do conteúdo |
| `src/lib/content-store.ts` | Leitura do conteúdo pelo site |
| `src/lib/content-meta.ts` | Regras editoriais (seções, ordem dos serviços, tags dos parceiros) |
| `src/lib/content-blocks.ts` | Conversão do HTML do artigo em blocos renderizáveis |
| `src/pages/admin/` | Painel de publicação |
| `api/contato.ts` | Função serverless do formulário de contato |
| `scripts/migrate-wp.mjs` | Migração one-off do WordPress; não é usado no dia a dia |

## Rotas

`/` · `/insights` · `/insights/:slug` · `/cases` · `/cases/:slug` · `/servicos` ·
`/servicos/:slug` · `/parceiros` · `/parceiros/:slug` · `/admin`

O projeto usa `BrowserRouter`, então o host precisa responder `index.html` nas rotas
internas — o `vercel.json` já faz esse rewrite.

## Publicar conteúdo

Pelo painel em `/admin`. O acesso é um Personal Access Token do GitHub com permissão
**Contents: Read and write** neste repositório; o token fica apenas na sessão da aba,
nunca no código.

Publicar cria um commit com o item e o índice **juntos** — se fossem gravados
separadamente, uma falha no meio deixaria o índice apontando para um arquivo que não
existe. O site entra no ar quando a Vercel terminar o deploy desse commit.

- **Rascunho** fica no repositório e não aparece no site.
- **Agendado** aparece sozinho quando a data chega, sem precisar de novo deploy.
- Imagens são redimensionadas e recomprimidas no navegador antes de subir.

Parceiros e serviços ainda são editados direto nos arquivos.

## Formulário de contato

`api/contato.ts` envia por e-mail e espera três variáveis de ambiente na Vercel:
`RESEND_API_KEY`, `CONTATO_PARA` e `CONTATO_DE`. Sem elas o formulário mostra o erro e
oferece envio direto por e-mail, já preenchido — ninguém perde a mensagem.

## Animações da home

As seções da home usam pin do GSAP ScrollTrigger e todas declaram `refreshPriority`
(ver `src/lib/scroll-pins.ts`). Isso não é detalhe: o ScrollTrigger só ordena a fila
antes de recalcular posições quando algum trigger declara prioridade. Sem isso ele
recalcula na ordem de criação, e uma seção medida antes de outra que está acima dela
herda uma posição defasada — foi o que fazia Parcerias se sobrepor a Insights.

Ao acrescentar uma seção fixada, dê a ela uma prioridade que respeite a ordem da página.
