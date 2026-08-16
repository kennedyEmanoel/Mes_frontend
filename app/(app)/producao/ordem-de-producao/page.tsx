import { ModulePage } from "../../../components/ModulePage";

function GestaoIcon() {
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
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}

function DashboardIcon() {
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
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="12" y1="20" x2="12" y2="9" />
      <line x1="18" y1="20" x2="18" y2="4" />
    </svg>
  );
}

function KanbanIcon() {
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
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  );
}

export default function OrdemDeProducaoPage() {
  return (
    <ModulePage
      breadcrumbItems={[
        { label: "Produção", href: "/producao" },
        { label: "Ordem de Produção" },
      ]}
      title="Módulo Produção - Ordem de produção"
      description="Esse módulo é responsável pelas funcionalidades de ordem de produção da Produção."
      items={[
        {
          label: "Gestão",
          description: "Gerencie ordens de produção com controle detalhado de etapas, responsáveis e status.",
          href: "/producao/ordem-de-producao/gestao",
          icon: <GestaoIcon />,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          label: "Dashboard",
          description: "Visualize indicadores, métricas e estatísticas sobre as ordens de produção em tempo real.",
          href: "/producao/ordem-de-producao/dashboard",
          icon: <DashboardIcon />,
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          label: "Kanban",
          description: "Acompanhe visualmente o fluxo de produção por meio de um quadro Kanban interativo.",
          href: "/producao/ordem-de-producao/kanban",
          icon: <KanbanIcon />,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
