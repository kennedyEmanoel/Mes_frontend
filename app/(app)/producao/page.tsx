import { ModulePage } from "../../components/ModulePage";

function OrdemProducaoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <line x1="8.5" y1="10" x2="15.5" y2="10" />
      <line x1="8.5" y1="14" x2="15.5" y2="14" />
    </svg>
  );
}

function ProdutosIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function ControleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="9" x2="9" y2="20" />
      <line x1="15" y1="9" x2="15" y2="20" />
    </svg>
  );
}

function PainelIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="4" width="19" height="13" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 13v-2" />
      <path d="M11 13V9" />
      <path d="M15 13v-3" />
    </svg>
  );
}

function AnaliseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="m7 15 4-4 3 3 5-6" />
    </svg>
  );
}

function OperadoresIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5" />
      <path d="M17.5 14.5a5.5 5.5 0 0 1 3 4.5" />
    </svg>
  );
}

function EtapasIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h6" />
    </svg>
  );
}

export default function ProducaoPage() {
  return (
    <ModulePage
      breadcrumbItems={[{ label: "Produção" }]}
      title="Módulo Produção"
      description="Esse módulo é responsável pelas funcionalidades da Produção."
      items={[
        {
          label: "Controle de produção",
          description: "Lance a produção hora a hora de cada operador nos cartões do dia.",
          href: "/producao/controle",
          icon: <ControleIcon />,
          iconBg: "bg-rose-100",
          iconColor: "text-rose-600",
        },
        {
          label: "Análise de desempenho",
          description: "Eficiência de cada operador por período, com tendência e pontos críticos.",
          href: "/producao/analise",
          icon: <AnaliseIcon />,
          iconBg: "bg-teal-100",
          iconColor: "text-teal-600",
        },
        {
          label: "Painel detalhado (TV)",
          description: "Uma etapa por vez, com o desempenho de cada operador na faixa atual.",
          href: "/painel/detalhado",
          icon: <PainelIcon />,
          iconBg: "bg-violet-100",
          iconColor: "text-violet-600",
        },
        {
          label: "Painel geral (TV)",
          description: "Todas as etapas com o total do dia e da faixa atual.",
          href: "/painel/geral",
          icon: <PainelIcon />,
          iconBg: "bg-violet-100",
          iconColor: "text-violet-600",
        },
        {
          label: "Ordem de Produção",
          description: "Crie, acompanhe e organize ordens de produção com informações detalhadas.",
          href: "/producao/ordem-de-producao",
          icon: <OrdemProducaoIcon />,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
        },
        {
          label: "Operadores",
          description: "Cadastre as pessoas que são escaladas nos cartões de produção.",
          href: "/producao/operadores",
          icon: <OperadoresIcon />,
          iconBg: "bg-sky-100",
          iconColor: "text-sky-600",
        },
        {
          label: "Produtos",
          description: "Cadastre e gerencie os produtos utilizados nas ordens de produção.",
          href: "/producao/produtos",
          icon: <ProdutosIcon />,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          label: "Etapas",
          description: "Cadastre as etapas do processo e suas variações.",
          href: "/producao/etapas",
          icon: <EtapasIcon />,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
