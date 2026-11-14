# Couch Party - App Mobile de Party Games

## Integrantes
- Amanda Jen - SP3154068
- Felipe Teixeira de Lima - SP3155048
- Rafael Teixeira Paulino - SP3163636
- Vinicius Tiago de Santana - SP3154726

## Proposta
**Ideia de Aplicativo:** Party Games

A proposta consiste no desenvolvimento de um aplicativo mobile focado em jogos do estilo party games, ou seja, jogos rápidos, dinâmicos e interativos que podem ser jogados presencialmente entre amigos, familiares ou grupos de pessoas, utilizando apenas um celular. A ideia é transformar o smartphone em uma ferramenta de entretenimento coletivo, incentivando a interação social, a criatividade e a diversão, sem a necessidade de tabuleiros, cartas físicas ou outros acessórios.

## Jogos
- Impostor
- Cidade dorme
- Werewolf (ações à noite e votações feitas no celular?)
- Jogo de perguntas (cada pessoa recebe uma pergunta e o impostor recebe uma pergunta diferente ou um range de valor para resposta)


# Regras e boas práticas para desenvolvimento

Estas orientações se aplicam a agentes de IA que atuem neste repositório:

## Antes de alterar o código
- Entenda o fluxo existente e siga os padrões já adotados no projeto. Mantenha cada mudança pequena e diretamente relacionada ao pedido.
- Consulte `package.json` para confirmar versões e ferramentas. Para APIs do Expo, EAS ou React Native, siga as instruções da seção **Expo has changed** abaixo.
- Confira se já existe uma solução no projeto antes de adicionar dependências. Não invente requisitos, scripts ou estruturas de pastas.

## React Native, Expo e TypeScript
- Priorize interfaces mobile-first, acessíveis e compatíveis com iOS e Android. Considere telas pequenas, áreas seguras, teclado e tamanhos de texto variados.
- Use APIs compatíveis com o SDK instalado. Verifique a disponibilidade de módulos nativos no Expo Go antes de depender deles.
- Mantenha o TypeScript preciso: prefira tipos explícitos, evite `any` e não oculte erros com casts ou supressões sem justificativa.
- Use Expo Router para navegação. Mantenha telas em `src/app/` e componentes, hooks e utilitários fora dessa pasta.
- Separe apresentação e lógica de negócio quando isso melhorar a clareza. Evite duplicação, estado global desnecessário e trabalho pesado durante renderizações.
- Trate estados de carregamento, vazio e erro. Use listas eficientes, como `FlatList`, quando apropriado.
- Inclua rótulos acessíveis, alvos de toque adequados e contraste suficiente; não comunique informações apenas por cor.

## Segurança e escopo
- Não inclua segredos, credenciais ou dados pessoais reais no código, logs ou exemplos. Valide entradas do usuário e dados externos.
- Não presuma permissões ou comportamentos específicos de uma plataforma; preserve a compatibilidade entre iOS e Android.
- Não edite manualmente `ios/` ou `android/` se forem gerados pelo Expo. Configure comportamento nativo por `app.json` ou config plugins.
- Altere somente o necessário para atender ao pedido. Preserve mudanças existentes do usuário e evite reformatações amplas sem necessidade.

## Verificação
- Após alterações de código, execute `npx expo lint` e `npx tsc --noEmit`, quando disponíveis. Se houver `bun.lock`, use `bunx` no lugar de `npx`.
- Corrija problemas introduzidos pela mudança e informe verificações que não puderam ser executadas. Nunca afirme ter executado comandos que não foram rodados.
- Ao realizar commits, siga o padrão **Conventional Commits**:
  ```
  <type>[optional scope]: <description>

  [optional body]

  [optional footer(s)]
  ```

# TODO Auto-generated - Expo

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
