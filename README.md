# Couch Party

Aplicativo mobile de **party games** (jogos de festa) pensado para juntar amigos, familiares ou grupos de pessoas presencialmente usando **apenas um celular**. A proposta é transformar o smartphone no centro da diversão coletiva, dispensando tabuleiros, cartas físicas ou acessórios extras.

---

## Jogos disponíveis

O aplicativo conta com três jogos para passar o celular de mão em mão durante as rodadas:

- **Impostor** *(3 a 12 jogadores)*: Todos os jogadores recebem a mesma palavra secreta, menos o Impostor. Em roda, cada pessoa dá uma dica curta sem entregar a palavra, enquanto o Impostor tenta se misturar. Depois do debate, o grupo vota para eliminar quem acha ser o Impostor.
- **Cidade Dorme** *(6 a 20 jogadores)*: Jogo de mistério noturno com os papéis de Assassino, Detetive, Anjo da Guarda e Cidadão. À noite, o celular passa em segredo para que os papéis ativos façam suas escolhas; ao amanhecer, o grupo debate e vota para eliminar suspeitos.
- **Perguntas** *(3 a 12 jogadores)*: Cada jogador vê sua pergunta em segredo e registra uma resposta no aparelho. A maioria recebe a mesma pergunta, mas quem está no papel de impostor recebe uma pergunta diferente (sem saber). Todas as respostas são exibidas juntas para o grupo comparar e votar.

---

## Tecnologias utilizadas

- **React Native** (`0.88.1`) e **React** (`19.3.0`)
- **Expo** (`~58.0.25`)
- **Expo Router** (`~58.0.31`) — navegação baseada em arquivos
- **TypeScript** (`~6.0.3`) — tipagem estática
- **AsyncStorage** (`@react-native-async-storage/async-storage`) — armazenamento local de jogadores e preferências
- **Expo Haptics** (`expo-haptics`) — feedback tátil nas interações
- **Expo Vector Icons** (`@expo/vector-icons`) — ícones da interface
- **ESLint** e **Prettier** — padronização e formatação de código

---

## Arquitetura e estrutura do projeto

O projeto separa as rotas das telas da lógica de negócio, dos componentes visuais e dos dados estáticos:

```text
couch-party/
├── assets/                  # Ícones e imagens do aplicativo
├── docs/                    # Protótipos de telas e materiais de referência
├── src/
│   ├── app/                 # Telas e rotas gerenciadas pelo Expo Router
│   │   ├── _layout.tsx      # Layout raiz e configuração de navegação
│   │   ├── index.tsx        # Tela inicial com a seleção de jogos
│   │   ├── players.tsx      # Gerenciamento da lista de jogadores
│   │   ├── rules.tsx        # Regras dos jogos
│   │   ├── settings.tsx     # Configurações do aplicativo
│   │   └── games/           # Telas individuais de cada jogo (impostor, cidade-dorme, perguntas)
│   ├── components/
│   │   ├── games/           # Fluxos de partida, modais de configuração e fases dos jogos
│   │   └── ui/              # Componentes reutilizáveis de interface (botões, avatares, timer, cabeçalho)
│   ├── constants/           # Metadados dos jogos e paleta/tema visual
│   ├── contexts/            # Contextos globais (lista de jogadores e configurações do app)
│   ├── data/                # Palavras, perguntas e dados das partidas
│   ├── hooks/               # Hooks customizados (jogadores, configurações, hápticos, revelar carta)
│   ├── types/               # Tipos e interfaces TypeScript
│   └── utils/               # Motores de regras e lógica das partidas
├── AGENTS.md                # Diretrizes de desenvolvimento do projeto
├── app.json                 # Configurações do Expo
├── LICENSE                  # Licença MIT
└── package.json             # Dependências e scripts
```

---

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- Aplicativo **Expo Go** no celular (Android ou iOS) ou um emulador configurado

### Passo a passo

1. Instale as dependências do projeto:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento do Expo:

```bash
npm start
```

3. Leia o QR Code exibido no terminal com o aplicativo **Expo Go** (ou use os atalhos abaixo para abrir diretamente):

```bash
npm run android   # Abre no Android
npm run ios       # Abre no iOS
npm run web       # Abre no navegador
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

| Integrante | GitHub | LinkedIn |
| :--- | :--- | :--- |
| **Amanda Jen** | [@AmandaJen](https://github.com/AmandaJen) | [LinkedIn](https://www.linkedin.com/in/amanda-jen-0a180b357/) |
| **Felipe Teixeira de Lima** | [@felipeteixeiradelima](https://github.com/felipeteixeiradelima) | [LinkedIn](https://www.linkedin.com/in/felipe-teixeira-de-lima/) |
| **Rafael Teixeira Paulino** | [@rafaeltpaulino](https://github.com/rafaeltpaulino) | [LinkedIn](https://www.linkedin.com/in/rafael-paulino-0ab786353/) |
| **Vinícius Tiago de Santana** | [@EnterName23](https://github.com/EnterName23) | [LinkedIn](https://www.linkedin.com/in/vin%C3%ADcius-tiago-de-santana-904907326/) |

---

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
