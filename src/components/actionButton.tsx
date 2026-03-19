import type { LucideIcon } from "lucide-react";
import { Download, Eye, Pencil, Printer, Trash2 } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  view: Eye,
  update: Pencil,
  delete: Trash2,
  print: Printer,
  download: Download,
};

const ActionButton = ({ type }: { type: string }) => {
  const Icon = iconMap[type];

  if (Icon) {
    return <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />;
  }

  return <img src={`/${type}.png`} alt={type} className="w-4 h-4" />;
};

export default ActionButton;
