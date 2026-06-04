import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSession } from "@/lib/admin-auth";
import {
  editableSettingFields,
  getSiteSettings,
  settingGroups,
  type EditableSettingKey,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams?: {
    saved?: string;
    error?: string;
  };
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const session = getAdminSession();

  if (!session) {
    redirect("/admin/login?next=/admin/settings");
  }

  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">站点设置</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          常用站点配置会保存到 Setting 表。前台读取优先级为：数据库
          Setting &gt; 环境变量 &gt; 代码默认值。空值允许保存，前台会自动回退。
        </p>
      </div>

      {searchParams?.saved ? (
        <div className="mb-5 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          站点设置已保存。
        </div>
      ) : null}

      {searchParams?.error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          站点设置保存失败，请稍后重试。
        </div>
      ) : null}

      <form action="/api/admin/settings" method="post" className="grid gap-5">
        {settingGroups.map((group) => {
          const fields = editableSettingFields.filter(
            (field) => field.group === group.key,
          );

          return (
            <Card key={group.key}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5">
                {fields.map((field) => {
                  const key = field.key as EditableSettingKey;
                  const value = settings[key];

                  return (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.inputType === "textarea" ? (
                        <textarea
                          id={field.key}
                          name={field.key}
                          defaultValue={value}
                          rows={"rows" in field ? field.rows : 4}
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentblue"
                        />
                      ) : (
                        <Input
                          id={field.key}
                          name={field.key}
                          defaultValue={value}
                        />
                      )}
                      <p className="text-xs leading-5 text-slate-500">
                        {field.description}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="deal">
            保存设置
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin">返回后台首页</a>
          </Button>
        </div>
      </form>
    </div>
  );
}
