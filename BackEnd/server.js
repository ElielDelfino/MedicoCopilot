import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para upload de arquivos de áudio
const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    // Aceitar apenas arquivos de áudio
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de áudio são permitidos'), false);
    }
  }
});

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// Endpoint para transcrever áudio ou texto
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // Se receber texto diretamente, retornar o texto
    if (req.body.text) {
      return res.status(200).json({ transcript: req.body.text });
    }

    // Se receber arquivo de áudio, transcrever usando OpenAI Whisper
    if (req.file) {
      const audioPath = req.file.path;
      const originalName = req.file.originalname || 'audio.webm';
      let fileExtension = path.extname(originalName).toLowerCase();
      
      // Se não tiver extensão, usar webm
      if (!fileExtension || fileExtension === '') {
        fileExtension = '.webm';
      }
      
      console.log('Arquivo recebido:', {
        originalName,
        fileExtension,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      // Renomear arquivo com extensão correta para o Whisper reconhecer o formato
      const newPath = audioPath + fileExtension;
      if (audioPath !== newPath) {
        fs.renameSync(audioPath, newPath);
      }
      
      try {
        // O Whisper precisa que o arquivo tenha a extensão correta no nome
        // Criar um novo caminho com o nome correto incluindo a extensão
        const finalPath = path.join(path.dirname(newPath), `audio${fileExtension}`);
        if (newPath !== finalPath) {
          fs.copyFileSync(newPath, finalPath);
          if (fs.existsSync(newPath)) {
            fs.unlinkSync(newPath);
          }
        }
        
        console.log('Enviando arquivo para Whisper:', finalPath);
        
        // O SDK do OpenAI aceita ReadStream, mas precisa que o arquivo tenha extensão no nome
        // O arquivo finalPath já tem a extensão correta (.webm)
        const fileStream = fs.createReadStream(finalPath);
        
        // Adicionar propriedade name ao stream para o SDK reconhecer o formato
        // O SDK do OpenAI detecta o formato pela extensão do nome do arquivo
        Object.defineProperty(fileStream, 'name', {
          value: `audio${fileExtension}`,
          writable: false
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'pt',
          response_format: 'json'
        });

        // Remover arquivo temporário
        if (fs.existsSync(finalPath)) {
          fs.unlinkSync(finalPath);
        }

        return res.status(200).json({ transcript: transcription.text });
      } catch (error) {
        console.error('Erro detalhado na transcrição:', error);
        // Remover arquivo temporário em caso de erro
        const finalPath = path.join(path.dirname(newPath), `audio${fileExtension}`);
        if (fs.existsSync(finalPath)) {
          fs.unlinkSync(finalPath);
        }
        if (fs.existsSync(newPath)) {
          fs.unlinkSync(newPath);
        }
        throw error;
      }
    }

    return res.status(400).json({ error: 'Envie um arquivo de áudio ou texto' });
  } catch (error) {
    console.error('Erro ao transcrever:', error);
    res.status(500).json({ 
      error: 'Erro ao processar transcrição',
      message: error.message 
    });
  }
});

// Endpoint para gerar diagnóstico médico
app.post('/api/diagnose', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript é obrigatório' });
    }

    const prompt = `Analise a seguinte transcrição de uma consulta médica e forneça um relatório estruturado em formato JSON com as seguintes seções:

1. "diagnosticos_provaveis": array de possíveis diagnósticos baseados nos sintomas e informações mencionadas
2. "doencas_associadas": array de doenças que podem estar associadas
3. "exames_sugeridos": array de exames que devem ser realizados para confirmar ou descartar os diagnósticos
4. "medicamentos_comuns": array de medicamentos comuns que podem ser prescritos (apenas sugestões, não prescrições)
5. "raciocinio_ia": string explicando o raciocínio clínico da IA, detalhando por que esses diagnósticos foram sugeridos, quais sintomas e sinais foram considerados, e a lógica por trás das recomendações. Deve ser um texto descritivo e educativo.

Transcrição da consulta:
${transcript}

IMPORTANTE: Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações adicionais. O formato deve ser:
{
  "diagnosticos_provaveis": ["diagnóstico 1", "diagnóstico 2"],
  "doencas_associadas": ["doença 1", "doença 2"],
  "exames_sugeridos": ["exame 1", "exame 2"],
  "medicamentos_comuns": ["medicamento 1", "medicamento 2"],
  "raciocinio_ia": "Texto explicativo detalhando o raciocínio clínico, análise dos sintomas mencionados e justificativa para os diagnósticos sugeridos."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente médico especializado em análise de consultas. Forneça informações precisas e estruturadas em formato JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0].message.content.trim();
    
    // Tentar extrair JSON da resposta (pode vir com markdown ou texto adicional)
    let jsonContent = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const relatorioData = JSON.parse(jsonContent);
    
    res.status(200).json(relatorioData);
  } catch (error) {
    console.error('Erro ao gerar diagnóstico:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar diagnóstico',
      message: error.message 
    });
  }
});

// Rodar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
