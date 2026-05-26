import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StepCard({
  step,
  title,
  description,
  icon: Icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-deal">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accentblue">{step}</p>
            <h3 className="mt-1 text-base font-semibold text-primary">{title}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}
