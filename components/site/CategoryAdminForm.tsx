import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CategoryFormValue = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type CategoryAdminFormProps = {
  action: string;
  backHref: string;
  title: string;
  submitLabel: string;
  category?: CategoryFormValue;
};

export function CategoryAdminForm({
  action,
  backHref,
  title,
  submitLabel,
  category,
}: CategoryAdminFormProps) {
  return (
    <form action={action} method="post" className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={category?.slug ?? ""}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">说明</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={category?.description ?? ""}
              rows={4}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">排序</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                step="1"
                defaultValue={category?.sortOrder ?? 0}
              />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={category?.isActive ?? true}
                className="h-4 w-4 rounded border-slate-300"
              />
              是否启用
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="deal">
          {submitLabel}
        </Button>
        <Button variant="outline" asChild>
          <Link href={backHref}>返回列表</Link>
        </Button>
      </div>
    </form>
  );
}
