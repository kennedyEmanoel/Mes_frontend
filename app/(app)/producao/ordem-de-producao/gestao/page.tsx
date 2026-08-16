import { Breadcrumb } from "../../../../components/Breadcrumb";

export default function GestaoPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Produção", href: "/producao" },
          { label: "Ordem de Produção", href: "/producao/ordem-de-producao" },
          { label: "Gestão" },
        ]}
      />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <h1 className="text-lg font-medium text-zinc-500">Em construção</h1>
      </div>
    </div>
  );
}
