import { PanelSession } from "./PanelSession";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelSession>{children}</PanelSession>;
}
