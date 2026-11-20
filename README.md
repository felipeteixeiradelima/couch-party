# Couch Party

Aplicativo mobile de **party games** (jogos de festa) pensado para juntar amigos, familiares ou grupos de pessoas presencialmente usando **apenas um celular**. A proposta é transformar o smartphone no centro da diversão coletiva, dispensando tabuleiros, cartas físicas ou acessórios extras.

---

## Jogos disponíveis

O aplicativo conta com três jogos para passar o celular de mão em mão durante as rodadas:

- **Impostor** _(3 a 12 jogadores)_: Todos os jogadores recebem a mesma palavra secreta, menos o Impostor. Em roda, cada pessoa dá uma dica curta sem entregar a palavra, enquanto o Impostor tenta se misturar. Depois do debate, o grupo vota para eliminar quem acha ser o Impostor.
- **Cidade Dorme** _(6 a 20 jogadores)_: Jogo de mistério noturno com os papéis de Assassino, Detetive, Anjo da Guarda e Cidadão. À noite, o celular passa em segredo para que os papéis ativos façam suas escolhas; ao amanhecer, o grupo debate e vota para eliminar suspeitos.
- **Perguntas** _(3 a 12 jogadores)_: Cada jogador vê sua pergunta em segredo e registra uma resposta no aparelho. A maioria recebe a mesma pergunta, mas quem está no papel de impostor recebe uma pergunta diferente (sem saber). Todas as respostas são exibidas juntas para o grupo comparar e votar.

---

## Recursos do aplicativo

- **Passar o celular em grupo**: fluxos pensados para uso presencial em um único aparelho, com confirmação de jogador e revelação protegida de papéis secretos.
- **Gerenciamento de jogadores**: cadastro, edição, remoção e reutilização de jogadores persistidos localmente em banco **SQLite**.
- **Histórico e acervo local**: banco de dados local com acervo de palavras/perguntas e registro de partidas jogadas.
- **Personalização**: suporte a **tema claro, escuro ou automático** (seguindo o sistema), além de controles para animações e feedback tátil.

---

## Tecnologias utilizadas

- **React Native** (`0.88.1`) e **React** (`19.3.1`)
- **Expo** (`~58.0.26`)
- **Expo Router** (`~58.0.32`) — navegação baseada em arquivos
- **TypeScript** (`~6.0.3`) — tipagem estática
- **Expo SQLite** (`expo-sqlite`) — banco de dados local para jogadores, conteúdo dos jogos e histórico de partidas
- **AsyncStorage** (`@react-native-async-storage/async-storage`) — armazenamento local de preferências (tema, animações e hápticos)
- **Expo Haptics** (`expo-haptics`) — feedback tátil nas interações
- **Expo Linear Gradient** (`expo-linear-gradient`) e **Expo Splash Screen** (`expo-splash-screen`) — gradientes e tela de abertura adaptativa ao tema
- **Expo Vector Icons** (`@expo/vector-icons`) — ícones da interface
- **Expo Dev Client** (`expo-dev-client`) e **EAS** (`eas.json`) — suporte a development builds e builds Android/iOS
- **ESLint** e **Prettier** — padronização e formatação de código

---

## Arquitetura e estrutura do projeto

O projeto separa as rotas das telas da lógica de negócio, da camada de dados SQLite, dos componentes visuais e dos dados estáticos:

```text
couch-party/
├── assets/                  # Ícones (incluindo adaptativo), logos e splash screens (claro/escuro)
├── docs/                    # Protótipos de telas e materiais de referência
├── src/
│   ├── app/                 # Telas e rotas gerenciadas pelo Expo Router
│   │   ├── _layout.tsx      # Layout raiz, provedores (SQLite, contextos) e navegação
│   │   ├── index.tsx        # Tela inicial com a seleção de jogos
│   │   ├── players.tsx      # Gerenciamento da lista de jogadores
│   │   ├── rules.tsx        # Regras dos jogos
│   │   ├── settings.tsx     # Configurações do aplicativo (tema, animações, hápticos)
│   │   └── games/           # Telas individuais de cada jogo (impostor, cidade-dorme, perguntas)
│   ├── components/
│   │   ├── games/           # Fluxos de partida, modais de configuração, fases (phases/) e Cidade Dorme (cidade-dorme/)
│   │   └── ui/              # Componentes reutilizáveis de interface (botões, avatares, timer, cabeçalho, modais, splash)
│   ├── constants/           # Metadados dos jogos e paleta/temas claro e escuro
│   ├── contexts/            # Contextos globais (jogadores via SQLite e configurações do app)
│   ├── data/                # Acervo inicial de palavras, perguntas e dados das partidas
│   ├── database/            # Camada SQLite (schema, inicialização, seed e repositórios)
│   ├── hooks/               # Hooks customizados (jogadores, configurações, tema, hápticos, revelar carta)
│   ├── types/               # Tipos e interfaces TypeScript
│   └── utils/               # Motores de regras, lógica das partidas e utilitários hápticos
├── AGENTS.md                # Diretrizes de desenvolvimento do projeto
├── app.json                 # Configurações do Expo
├── eas.json                 # Perfis de build e envio do EAS
├── LICENSE                  # Licença MIT
└── package.json             # Dependências e scripts
```

---

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- Aplicativo **Expo Go** (ou Development Build) no celular (Android ou iOS) ou um emulador configurado

### Passo a passo

1. Instale as dependências do projeto:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento do Expo (configurado com túnel via `@expo/ngrok`):

```bash
npm start
```

3. Leia o QR Code exibido no terminal com o aplicativo **Expo Go** (ou use os atalhos abaixo para abrir diretamente):

```bash
npm run android   # Abre no Android (com túnel ngrok)
npm run ios       # Abre no iOS (com túnel ngrok)
npm run web       # Abre no navegador (com túnel ngrok)
```

### Scripts de verificação e formatação

```bash
npm run lint          # Verifica problemas de lint com o Expo
npx tsc --noEmit      # Verifica a tipagem TypeScript
npm run format:check  # Verifica a formatação com o Prettier
npm run format        # Formata os arquivos com o Prettier
```

---

## Autores

| Integrante                    | GitHub                                                           | LinkedIn                                                                          |
| :---------------------------- | :--------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Amanda Jen**                | [@AmandaJen](https://github.com/AmandaJen)                       | [LinkedIn](https://www.linkedin.com/in/amanda-jen-0a180b357/)                     |
| **Felipe Teixeira de Lima**   | [@felipeteixeiradelima](https://github.com/felipeteixeiradelima) | [LinkedIn](https://www.linkedin.com/in/felipe-teixeira-de-lima/)                  |
| **Rafael Teixeira Paulino**   | [@rafaeltpaulino](https://github.com/rafaeltpaulino)             | [LinkedIn](https://www.linkedin.com/in/rafael-paulino-0ab786353/)                 |
| **Vinícius Tiago de Santana** | [@EnterName23](https://github.com/EnterName23)                   | [LinkedIn](https://www.linkedin.com/in/vin%C3%ADcius-tiago-de-santana-904907326/) |

---

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
