import calendar from "./icons/calendar.svg";
import close from "./icons/close.svg";
import consultations from "./icons/consultations.svg";
import deleteIcon from "./icons/delete.svg";
import diseases from "./icons/diseases.svg";
import exams from "./icons/exams.svg";
import finish from "./icons/finish.svg";
import loading from "./icons/loading.svg";
import medicines from "./icons/medicines.svg";
import mic from "./icons/mic.svg";
import reason from "./icons/reasoning.svg";
import reopen from "./icons/reopen.svg";

export const Icons = {
  consultations: {
    src: consultations,
    alt: "Ícone representando diagnósticos prováveis",
  },
  close: {
    src: close,
    alt: "Ícone de fechar seção",
  },
  reopen: {
    src: reopen,
    alt: "Ícone para reabrir consulta",
  },
  delete: {
    src: deleteIcon,
    alt: "Ícone de excluir consulta",
  },
  loading: {
    src: loading,
    alt: "Ícone indicando carregamento",
  },
  mic: {
    src: mic,
    alt: "Ícone de microfone para iniciar consulta",
  },
  finish: {
    src: finish,
    alt: "Ícone de finalizar consulta",
  },
  calendar: {
    src: calendar,
    alt: "Ícone de data da consulta",
  },
  diseases: {
    src: diseases,
    alt: "Ícone de doenças associadas",
  },
  exams: {
    src: exams,
    alt: "Ícone de exames sugeridos",
  },
  medicines: {
    src: medicines,
    alt: "Ícone de medicamentos comuns",
  },
  reasoning: {
    src: reason,
    alt: "Ícone de raciocínio da IA",
  },
} as const;

export type IconKey = keyof typeof Icons;

