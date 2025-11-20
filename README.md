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
cd backend
npm install
```

### 3. Instale as dependências do Frontend

```bash
cd ../frontend
npm install
```

## Configuração

### Backend

1. Crie um arquivo `.env` na pasta `BackEnd/`:

```bash
cd backend
touch .env
```

2. Adicione sua chave da API OpenAI no arquivo `.env`:

```env
OPENAI_API_KEY=sua-chave-api-aqui
```

### Frontend 

Se o backend estiver em um servidor diferente do `localhost:3000`, crie um arquivo `.env` na pasta `frontend/`:

Adicione:

```env
VITE_API_URL=http://seu-backend.com
```

## Execução

### Backend

```bash
cd backend
npm start
# ou
node server.js
```
Caso queira subir localmente, altere o CORS origin para o **http://localhost:[PORT]**
O servidor estará rodando em: **https://medicocopilot-a4im.onrender.com**

### Frontend

Em um novo terminal:

```bash
cd frontend
npm run dev
```

A aplicação estará disponível em: **https://medicocopilot-1.onrender.com**
Se for Localmente **http://localhost:[PORT]**

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

## Notas Importantes

1. **CORS**: O backend está configurado para aceitar requisições apenas de `origin: https://medicocopilot-1.onrender.com `
2. **Uploads**: Os arquivos de áudio são temporários e são deletados após o processamento
3. **LocalStorage**: As consultas são salvas no navegador (máximo de 50 consultas)
4. **EndPointTranscribe**: Está com opção de texto para realizar testes no backend.(ficar mais fácil de configurar a IA) 

## Troubleshooting

### Erro: "OPENAI_API_KEY is missing or empty"
- Verifique se o arquivo `.env` existe na pasta `backend/`
- Confirme que a chave está correta e sem espaços extras

### Erro de CORS
- Certifique-se de que o frontend está rodando na porta correta
- Verifique a configuração de CORS no `server.js`

### Erro ao transcrever áudio
- Verifique se o formato do áudio é suportado (WebM, MP3, etc.)
- Confirme que a chave da API OpenAI está válida e com créditos

## LICENÇA
-  Código para fins acâdemicos. 


