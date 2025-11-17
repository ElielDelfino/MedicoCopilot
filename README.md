<<<<<<< HEAD
# FrontDevClub - Sistema de Consulta Médica com IA

Sistema web para transcrição de áudio e geração de relatórios médicos utilizando OpenAI Whisper e GPT-3.5.

## Tecnologias

### Frontend
- React + TypeScript
- Vite
- Axios
- CSS Modules

### Backend
- Node.js + Express
- OpenAI API (Whisper + GPT-3.5)
- Multer (upload de arquivos)
- dotenv

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Chave da API OpenAI

## Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd FrontDevClub
```

### 2. Instale as dependências do Backend

```bash
cd BackEnd
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../FrontEnd
npm install
```

## Configuração

### Backend

1. Crie um arquivo `.env` na pasta `BackEnd/`:

```bash
cd BackEnd
touch .env
```

2. Adicione sua chave da API OpenAI no arquivo `.env`:

```env
OPENAI_API_KEY=sua-chave-api-aqui
```

**Como obter a chave:**
- Acesse: https://platform.openai.com/api-keys
- Faça login ou crie uma conta
- Clique em "Create new secret key"
- Copie a chave e cole no arquivo `.env`

### Frontend (Opcional)

Se o backend estiver em um servidor diferente do `localhost:3000`, crie um arquivo `.env` na pasta `FrontEnd/`:

```bash
cd FrontEnd
touch .env
```

Adicione:

```env
VITE_API_URL=http://localhost:3000
```

## Execução

### Backend

```bash
cd BackEnd
npm start
# ou
node server.js
```

O servidor estará rodando em: **http://localhost:3000**

### Frontend

Em um novo terminal:

```bash
cd FrontEnd
npm run dev
```

A aplicação estará disponível em: **http://localhost:5173**

## Endpoints da API

### POST `/api/transcribe`

Transcreve áudio ou texto para texto.

**Body (FormData):**
- `audio`: Arquivo de áudio (opcional)
- `text`: Texto direto (opcional)

**Resposta:**
```json
{
  "transcript": "Texto transcrito aqui..."
}
```

### POST `/api/diagnose`

Gera relatório médico baseado na transcrição.

**Body (JSON):**
```json
{
  "transcript": "Texto da consulta médica..."
}
```

**Resposta:**
```json
{
  "diagnosticos_provaveis": ["Diagnóstico 1", "Diagnóstico 2"],
  "doencas_associadas": ["Doença 1", "Doença 2"],
  "exames_sugeridos": ["Exame 1", "Exame 2"],
  "medicamentos_comuns": ["Medicamento 1", "Medicamento 2"],
  "raciocinio_ia": "Texto explicativo do raciocínio clínico..."
}
```

## Estrutura do Projeto

```
FrontDevClub/
├── BackEnd/
│   ├── server.js          # Servidor Express
│   ├── package.json
│   ├── .env              # Variáveis de ambiente (criar)
│   └── uploads/           # Arquivos temporários de áudio
│
└── FrontEnd/
    ├── src/
    │   ├── pages/
    │   │   └── Home/      # Página principal
    │   ├── services/
    │   │   └── api.ts     # Configuração do Axios
    │   ├── assets/
    │   │   └── icons/     # Ícones SVG
    │   └── main.tsx       # Entry point
    ├── package.json
    └── .env              # Variáveis de ambiente (opcional)
```

## Scripts Disponíveis

### Backend
- `npm start` ou `node server.js` - Inicia o servidor

### Frontend
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção

## Notas Importantes

1. **Chave da API OpenAI**: Mantenha sua chave segura e nunca commite o arquivo `.env` no Git
2. **CORS**: O backend está configurado para aceitar requisições apenas de `http://localhost:5173`
3. **Uploads**: Os arquivos de áudio são temporários e são deletados após o processamento
4. **LocalStorage**: As consultas são salvas no navegador (máximo de 50 consultas)

## Troubleshooting

### Erro: "OPENAI_API_KEY is missing or empty"
- Verifique se o arquivo `.env` existe na pasta `BackEnd/`
- Confirme que a chave está correta e sem espaços extras

### Erro de CORS
- Certifique-se de que o frontend está rodando na porta 5173
- Verifique a configuração de CORS no `server.js`

### Erro ao transcrever áudio
- Verifique se o formato do áudio é suportado (WebM, MP3, etc.)
- Confirme que a chave da API OpenAI está válida e com créditos

## Licença

Este projeto é de uso educacional.

=======
# MedicoCopilot
>>>>>>> f847b3d70ebc211c85ed8f6ac3f166aa7c0b95ed
