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
          label: "Ordem de Produção",
          description: "Crie, acompanhe e organize ordens de produção com informações detalhadas.",
          href: "/producao/ordem-de-producao",
          icon: <OrdemProducaoIcon />,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
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
          description: "Cadastre modelos de etapa reutilizáveis para usar nas ordens de produção.",
          href: "/producao/etapas",
          icon: <EtapasIcon />,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
