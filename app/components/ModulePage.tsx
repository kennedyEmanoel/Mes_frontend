import Link from "next/link";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";

export interface ModuleItem {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

interface ModulePageProps {
  breadcrumbItems: BreadcrumbItem[];
  title: string;
  description: string;
  items: ModuleItem[];
}

export function ModulePage({
  breadcrumbItems,
  title,
  description,
  items,
}: ModulePageProps) {
  return (
    <div>
      <Breadcrumb items={breadcrumbItems} />

      <div className="px-6 py-6">
        <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>

        <div className="mt-6 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-6 rounded-lg border border-zinc-200 bg-white p-6 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-start gap-3 rounded-md"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconBg} ${item.iconColor}`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{item.label}</p>
                <p className="mt-0.5 text-sm text-zinc-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
