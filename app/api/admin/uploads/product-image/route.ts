import { createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type OssConfig = {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  publicBaseUrl: string;
};

function getOssConfig(): OssConfig | null {
  const region = process.env.ALIYUN_OSS_REGION?.trim();
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET?.trim();
  const bucket = process.env.ALIYUN_OSS_BUCKET?.trim();
  const publicBaseUrl = process.env.ALIYUN_OSS_PUBLIC_BASE_URL?.trim();

  if (!region || !accessKeyId || !accessKeySecret || !bucket || !publicBaseUrl) {
    return null;
  }

  return {
    region,
    accessKeyId,
    accessKeySecret,
    bucket,
    publicBaseUrl,
  };
}

function normalizeRegion(region: string) {
  return region.startsWith("oss-") ? region : `oss-${region}`;
}

function getOssEndpoint({ bucket, region }: Pick<OssConfig, "bucket" | "region">) {
  return `https://${bucket}.${normalizeRegion(region)}.aliyuncs.com`;
}

function getPublicUrl(baseUrl: string, objectKey: string) {
  return `${baseUrl.replace(/\/+$/g, "")}/${objectKey}`;
}

function getObjectKey(extension: string) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const randomName = randomBytes(12).toString("hex");

  return `products/${year}/${month}/${randomName}.${extension}`;
}

function signOssPutObject({
  accessKeySecret,
  bucket,
  objectKey,
  contentType,
  date,
}: {
  accessKeySecret: string;
  bucket: string;
  objectKey: string;
  contentType: string;
  date: string;
}) {
  const canonicalizedResource = `/${bucket}/${objectKey}`;
  const stringToSign = `PUT\n\n${contentType}\n${date}\n${canonicalizedResource}`;

  return createHmac("sha1", accessKeySecret)
    .update(stringToSign)
    .digest("base64");
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return jsonError("未登录或后台登录已过期，请重新登录。", 401);
  }

  const config = getOssConfig();

  if (!config) {
    return jsonError("OSS 环境变量未配置，请先配置 ALIYUN_OSS_*", 400);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("请选择要上传的图片。");
  }

  const extension = allowedImageTypes.get(file.type);

  if (!extension) {
    return jsonError("图片格式不支持，请上传 jpg、jpeg、png 或 webp。");
  }

  if (file.size > maxImageSize) {
    return jsonError("图片超过大小限制，单张图片不能超过 5MB。");
  }

  const objectKey = getObjectKey(extension);
  const date = new Date().toUTCString();
  const signature = signOssPutObject({
    accessKeySecret: config.accessKeySecret,
    bucket: config.bucket,
    objectKey,
    contentType: file.type,
    date,
  });
  const endpoint = getOssEndpoint(config);
  const uploadUrl = `${endpoint}/${objectKey}`;

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `OSS ${config.accessKeyId}:${signature}`,
        "Content-Type": file.type,
        Date: date,
      },
      body: Buffer.from(await file.arrayBuffer()),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("OSS product image upload failed", {
        status: response.status,
        responseText,
      });

      return jsonError("OSS 上传失败，请检查 Bucket、Region、权限和 CDN 域名配置。", 500);
    }
  } catch (error) {
    console.error("OSS product image upload request failed", error);
    return jsonError("OSS 上传失败，请检查网络和 OSS 配置。", 500);
  }

  return NextResponse.json({
    ok: true,
    url: getPublicUrl(config.publicBaseUrl, objectKey),
    objectKey,
  });
}
