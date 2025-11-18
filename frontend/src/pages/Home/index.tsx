import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import api from "../../services/api";
import { Icons } from "../../assets/icons";
import "./styles.css";

type StatusType = "success" | "error" | "info" | "";

interface StatusState {
  message: string;
  type: StatusType;
  visible: boolean;
}

interface RelatorioMedico {
  diagnosticos_provaveis?: string[];
  doencas_associadas?: string[];
  exames_sugeridos?: string[];
  medicamentos_comuns?: string[];
  raciocinio_ia?: string;
}

interface Consulta {
  id: string;
  data: string;
  transcricao: string;
  relatorio: RelatorioMedico | null;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface ExtendedWindow extends Window {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
}

const getSpeechRecognitionInstance = (): SpeechRecognitionInstance | null => {
  if (typeof window === "undefined") return null;
  const extendedWindow = window as ExtendedWindow;
  const Constructor =
    extendedWindow.SpeechRecognition || extendedWindow.webkitSpeechRecognition;
  return Constructor ? new Constructor() : null;
};

const getAxiosErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    return data?.error || data?.message || error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

function Home() {
  const [transcricao, setTranscricao] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: "",
    visible: false,
  });
  const [relatorio, setRelatorio] = useState<RelatorioMedico | null>(null);
  const [isLoadingRelatorio, setIsLoadingRelatorio] = useState(false);
  const [consultasAnteriores, setConsultasAnteriores] = useState<Consulta[]>([]);
  const [mostrarConsultas, setMostrarConsultas] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const showStatus = useCallback((message: string, type: StatusType) => {
    setStatus({ message, type, visible: true });

    if (type === "success") {
      setTimeout(() => {
        setStatus({ message: "", type: "", visible: false });
      }, 3000);
    }
  }, []);

  useEffect(() => {
    // Verificar se o navegador suporta Web Speech API
    const recognitionInstance = getSpeechRecognitionInstance();
    if (recognitionInstance) {
      recognitionRef.current = recognitionInstance;

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "pt-BR";

      recognitionRef.current.onstart = () => {
        isRecordingRef.current = true;
        setIsRecording(true);
        showStatus("Gravando... Fale agora.", "info");
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscricao(finalTranscriptRef.current + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Erro na transcrição:", event.error);
        showStatus("Erro: " + event.error, "error");
        isRecordingRef.current = false;
        setIsRecording(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecordingRef.current) {
          // Reiniciar automaticamente se ainda estiver gravando
          try {
            recognitionRef.current?.start();
          } catch (e) {
            isRecordingRef.current = false;
            setIsRecording(false);
          }
        }
      };
    } else {
      showStatus(
        "Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.",
        "error"
      );
    }

    return () => {
      if (recognitionRef.current && isRecordingRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showStatus]);

  // Carregar consultas do localStorage ao montar
  useEffect(() => {
    const consultasSalvas = localStorage.getItem("consultas_medicas");
    if (consultasSalvas) {
      try {
        setConsultasAnteriores(JSON.parse(consultasSalvas));
      } catch (e) {
        console.error("Erro ao carregar consultas:", e);
      }
    }
  }, []);

  // Salvar consulta no localStorage
  const salvarConsulta = useCallback((transcricaoTexto: string, relatorioMedico: RelatorioMedico | null) => {
    const novaConsulta: Consulta = {
      id: Date.now().toString(),
      data: new Date().toLocaleString("pt-BR"),
      transcricao: transcricaoTexto,
      relatorio: relatorioMedico,
    };

    const consultasExistentes: Consulta[] = JSON.parse(
      localStorage.getItem("consultas_medicas") || "[]"
    );
    const novasConsultas = [novaConsulta, ...consultasExistentes].slice(0, 50); // Manter apenas as 50 mais recentes

    localStorage.setItem("consultas_medicas", JSON.stringify(novasConsultas));
    setConsultasAnteriores(novasConsultas);
  }, []);

  // Reabrir uma consulta anterior
  const reabrirConsulta = useCallback((consulta: Consulta) => {
    setTranscricao(consulta.transcricao);
    setRelatorio(consulta.relatorio);
    setMostrarConsultas(false);
    showStatus("Consulta reaberta!", "success");
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [showStatus]);

  // Deletar uma consulta
  const deletarConsulta = useCallback(
    (id: string) => {
      setConsultasAnteriores((prevConsultas) => {
        const novasConsultas = prevConsultas.filter((c) => c.id !== id);
        localStorage.setItem(
          "consultas_medicas",
          JSON.stringify(novasConsultas)
        );
        return novasConsultas;
      });
      showStatus("Consulta deletada!", "success");
    },
    [showStatus]
  );

  const gerarRelatorioMedico = useCallback(async (transcricaoTexto?: string) => {
    const textoTranscricao = transcricaoTexto || finalTranscriptRef.current || "";
    
    if (!textoTranscricao.trim()) {
      showStatus("Não há transcrição para analisar.", "error");
      return;
    }

    setIsLoadingRelatorio(true);
    setRelatorio(null);

    try {
      // Chamar endpoint do backend para gerar diagnóstico
      const response = await api.post<RelatorioMedico>(
        "/api/diagnose",
        {
          transcript: textoTranscricao,
        }
      );
      const relatorioData = response.data;
      setRelatorio(relatorioData);
      showStatus("Relatório médico gerado com sucesso!", "success");
      
      // Salvar consulta no localStorage
      salvarConsulta(textoTranscricao, relatorioData);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      const message = getAxiosErrorMessage(
        error,
        "Erro ao gerar diagnóstico no servidor"
      );
      showStatus(`Erro ao gerar relatório: ${message}`, "error");
    } finally {
      setIsLoadingRelatorio(false);
    }
  }, [showStatus, salvarConsulta]);

  const transcreverAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setTranscricao("");
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await api.post<{ transcript?: string }>(
        "/api/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = response.data;
      
      if (data.transcript && data.transcript.trim()) {
        // Exibir transcrição recebida na UI
        setTranscricao(data.transcript);
        showStatus("Transcrição concluída!", "success");
        
        // Usar a transcrição recebida para gerar o diagnóstico
        await gerarRelatorioMedico(data.transcript);
      } else {
        showStatus("Nenhuma transcrição retornada.", "error");
      }
    } catch (error) {
      console.error("Erro ao transcrever:", error);
      const message = getAxiosErrorMessage(
        error,
        "Erro ao transcrever áudio no servidor"
      );
      showStatus(`Erro ao transcrever: ${message}`, "error");
    } finally {
      setIsTranscribing(false);
    }
  }, [showStatus, gerarRelatorioMedico]);

  const startRecording = useCallback(async () => {
    finalTranscriptRef.current = "";
    setTranscricao("");
    
    try {
      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Iniciar Web Speech API para feedback visual em tempo real
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Erro ao iniciar Web Speech API:", e);
        }
      }

      // Criar MediaRecorder para gravar áudio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Parar Web Speech API
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // Ignorar erros
          }
        }

        // Criar blob do áudio gravado
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Parar todas as tracks do stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Transcrever o áudio usando o endpoint
        await transcreverAudio(audioBlob);
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      showStatus("Gravando... Fale agora.", "info");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      showStatus("Erro ao acessar o microfone. Verifique as permissões.", "error");
    }
  }, [showStatus, transcreverAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      isRecordingRef.current = false;
      setIsRecording(false);
      mediaRecorderRef.current.stop();
      showStatus("Processando áudio...", "info");
    }
  }, [isRecording, showStatus]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="container">
      {/* Botão para mostrar/ocultar consultas anteriores */}
      <div className="consultas-header">
        <button
          type="button"
          onClick={() => setMostrarConsultas(!mostrarConsultas)}
          className="btn-consultas"
        >
          {mostrarConsultas ? (
            <>
              <img src={Icons.close.src} alt={Icons.close.alt} className="icon" />
              Fechar
            </>
          ) : (
            <>
              <img
                src={Icons.consultations.src}
                alt={Icons.consultations.alt}
                className="icon"
              />
              Consultas Anteriores
            </>
          )}
          {consultasAnteriores.length > 0 && (
            <span className="consultas-badge">
              {consultasAnteriores.length}
            </span>
          )}
        </button>
      </div>

      {/* Lista de Consultas Anteriores */}
      {mostrarConsultas && (
        <form id="formConsultas" className="form-consultas">
          <h2>Consultas Anteriores</h2>
          {consultasAnteriores.length === 0 ? (
            <p className="consultas-empty">
              Nenhuma consulta salva ainda.
            </p>
          ) : (
            <div className="consultas-grid">
              {consultasAnteriores.map((consulta) => (
                <div
                  key={consulta.id}
                  className="consulta-card"
                >
                  <div className="consulta-card-header">
                    <div className="consulta-card-content">
                      <strong className="consulta-data">
                        <img
                          src={Icons.calendar.src}
                          alt={Icons.calendar.alt}
                          className="icon"
                        />
                        {consulta.data}
                      </strong>
                      <p className="consulta-preview">
                        {consulta.transcricao.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="consulta-actions">
                      <button
                        type="button"
                        onClick={() => reabrirConsulta(consulta)}
                        className="btn-reabrir"
                      >
                        <img
                          src={Icons.reopen.src}
                          alt={Icons.reopen.alt}
                          className="icon"
                        />
                        Reabrir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Tem certeza que deseja deletar esta consulta?")) {
                            deletarConsulta(consulta.id);
                          }
                        }}
                        className="btn-deletar"
                        aria-label="Deletar consulta"
                      >
                        <img
                          src={Icons.delete.src}
                          alt={Icons.delete.alt}
                          className="icon icon-only"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>
      )}

      {/* Formulário: Transcrição de Áudio */}
      <form id="formTranscricao">
        <h2>Consulta Médica</h2>

        <div className="form-group">
          <label htmlFor="transcricaoTexto">Contexto do Paciente</label>
          <textarea
            id="transcricaoTexto"
            name="transcricao"
            placeholder="Informações clinicas do paciente: medicamentos, prontuários anteriores ou exames. Isso ajuda a fornecer um relatório mais completo"
            readOnly
            value={transcricao}
          />
          {(isTranscribing || isLoadingRelatorio) && (
            <div className="loading-message">
              {isTranscribing && (
                <span>
                  <img
                    src={Icons.loading.src}
                    alt={Icons.loading.alt}
                    className="icon"
                  />
                  Transcrevendo áudio...
                </span>
              )}
              {isLoadingRelatorio && (
                <span>
                  <img
                    src={Icons.loading.src}
                    alt={Icons.loading.alt}
                    className="icon"
                  />
                  Gerando relatório médico...
                </span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <button
            type="button"
            id="btnRecord"
            className={`btn-record ${isRecording ? "recording" : ""}`}
            onClick={toggleRecording}
            disabled={isTranscribing}
          >
            {isRecording ? (
              <>
                <img
                  src={Icons.finish.src}
                  alt={Icons.finish.alt}
                  className="icon"
                />
                Finalizar Consulta
              </>
            ) : (
              <>
                <img src={Icons.mic.src} alt={Icons.mic.alt} className="icon" />
                Iniciar Consulta
              </>
            )}
          </button>
          {status.visible && (
            <div className={`status ${status.type}`}>{status.message}</div>
          )}
        </div>
      </form>

      {/* Relatório Médico */}
      {(isLoadingRelatorio || relatorio) && (
        <form id="formRelatorio">
          <h2>Relatório Médico</h2>

          {isLoadingRelatorio && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Gerando relatório médico...</p>
            </div>
          )}

          {relatorio && !isLoadingRelatorio && (
            <div className="relatorio-container">
              <div className="relatorio-section">
                <h3>
                  <img
                    src={Icons.consultations.src}
                    alt={Icons.consultations.alt}
                    className="icon"
                  />
                  Diagnósticos Prováveis
                </h3>
                <ul>
                  {relatorio.diagnosticos_provaveis?.map(
                    (diagnostico, index) => (
                      <li key={index}>{diagnostico}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="relatorio-section">
                <h3>
                  <img
                    src={Icons.diseases.src}
                    alt={Icons.diseases.alt}
                    className="icon"
                  />
                  Doenças Associadas
                </h3>
                <ul>
                  {relatorio.doencas_associadas?.map((doenca, index) => (
                    <li key={index}>{doenca}</li>
                  ))}
                </ul>
              </div>

              <div className="relatorio-section">
                <h3>
                  <img
                    src={Icons.exams.src}
                    alt={Icons.exams.alt}
                    className="icon"
                  />
                  Exames Sugeridos
                </h3>
                <ul>
                  {relatorio.exames_sugeridos?.map((exame, index) => (
                    <li key={index}>{exame}</li>
                  ))}
                </ul>
              </div>

              <div className="relatorio-section">
                <h3>
                  <img
                    src={Icons.medicines.src}
                    alt={Icons.medicines.alt}
                    className="icon"
                  />
                  Medicamentos Comuns
                </h3>
                <ul>
                  {relatorio.medicamentos_comuns?.map((medicamento, index) => (
                    <li key={index}>{medicamento}</li>
                  ))}
                </ul>
              </div>

              {relatorio.raciocinio_ia && (
                <div className="relatorio-section">
                  <h3>
                    <img
                      src={Icons.reasoning.src}
                      alt={Icons.reasoning.alt}
                      className="icon"
                    />
                    Raciocínio da IA
                  </h3>
                  <p className="raciocinio-texto">{relatorio.raciocinio_ia}</p>
                </div>
              )}

            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default Home;
