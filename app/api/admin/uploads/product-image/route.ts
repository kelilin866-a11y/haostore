import { createHmac, randomBytes } from "crypto";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

const maxImageSize = 5 * 1024 * 1024;
const ossUploadTimeoutMs = 20_000;
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

function getEnvValue(primaryKey: string, fallbackKey: string) {
  return (
    process.env[primaryKey]?.trim() || process.env[fallbackKey]?.trim() || ""
  );
}

function getOssConfig() {
  const config: OssConfig = {
    region: getEnvValue("ALIYUN_OSS_REGION", "ALI_OSS_REGION"),
    accessKeyId: getEnvValue(
      "ALIYUN_OSS_ACCESS_KEY_ID",
      "ALI_OSS_ACCESS_KEY_ID",
    ),
    accessKeySecret: getEnvValue(
      "ALIYUN_OSS_ACCESS_KEY_SECRET",
      "ALI_OSS_ACCESS_KEY_SECRET",
    ),
    bucket: getEnvValue("ALIYUN_OSS_BUCKET", "ALI_OSS_BUCKET"),
    publicBaseUrl: getEnvValue(
      "ALIYUN_OSS_PUBLIC_BASE_URL",
      "ALI_OSS_PUBLIC_BASE_URL",
    ),
  };
  const missing = [
    ["ALIYUN_OSS_REGION / ALI_OSS_REGION", config.region],
    ["ALIYUN_OSS_ACCESS_KEY_ID / ALI_OSS_ACCESS_KEY_ID", config.accessKeyId],
    [
      "ALIYUN_OSS_ACCESS_KEY_SECRET / ALI_OSS_ACCESS_KEY_SECRET",
      config.accessKeySecret,
    ],
    ["ALIYUN_OSS_BUCKET / ALI_OSS_BUCKET", config.bucket],
    [
      "ALIYUN_OSS_PUBLIC_BASE_URL / ALI_OSS_PUBLIC_BASE_URL",
      config.publicBaseUrl,
    ],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return { config, missing };
}

function normalizeRegion(region: string) {
  const trimmed = region.trim().replace(/^https?:\/\//i, "");
  const withoutDomain = trimmed.replace(/\.aliyuncs\.com\/?$/i, "");

  return withoutDomain.startsWith("oss-")
    ? withoutDomain
    : `oss-${withoutDomain}`;
}

function getOssEndpoint(region: string) {
  return `https://${normalizeRegion(region)}.aliyuncs.com`;
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

type ErrorMeta = {
  name: string;
  message: string;
  code?: string;
  cause?: ErrorMeta;
};

function getErrorMeta(error: unknown): ErrorMeta {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError", message: String(error || "unknown") };
  }

  const record = error as Record<string, unknown>;
  return {
    name:
      typeof record.name === "string" ? record.name : error.constructor.name,
    message: typeof record.message === "string" ? record.message : "unknown",
    code: typeof record.code === "string" ? record.code : undefined,
    cause:
      typeof record.cause === "object" && record.cause
        ? getErrorMeta(record.cause)
        : undefined,
  };
}

function logOssUploadError({
  config,
  endpoint,
  error,
  status,
  responseText,
}: {
  config: OssConfig;
  endpoint: string;
  error?: unknown;
  status?: number;
  responseText?: string;
}) {
  console.error("[oss/product-image] upload failed", {
    region: config.region,
    normalizedRegion: normalizeRegion(config.region),
    bucketConfigured: Boolean(config.bucket),
    publicBaseUrlConfigured: Boolean(config.publicBaseUrl),
    endpoint,
    status,
    responseText,
    error: error ? getErrorMeta(error) : undefined,
  });
}

async function putObjectWithTimeout({
  uploadUrl,
  headers,
  body,
}: {
  uploadUrl: string;
  headers: HeadersInit;
  body: ArrayBuffer;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ossUploadTimeoutMs);

  try {
    return await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  if (!getAdminSession()) {
    return jsonError("未登录或后台登录已过期，请重新登录。", 401);
  }

  const { config, missing } = getOssConfig();

  if (missing.length > 0) {
    console.error("[oss/product-image] config missing", {
      missing,
      region: config.region,
      bucketConfigured: Boolean(config.bucket),
      publicBaseUrlConfigured: Boolean(config.publicBaseUrl),
    });
    return jsonError(`OSS 环境变量未配置完整：${missing.join("、")}`, 400);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    console.error("[oss/product-image] parse multipart form failed", {
      error: getErrorMeta(error),
    });
    return jsonError("图片上传请求解析失败，请重新选择图片后再试。", 400);
  }

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
  const endpoint = getOssEndpoint(config.region);
  const uploadUrl = `${endpoint}/${config.bucket}/${objectKey}`;

  try {
    const fileBuffer = await file.arrayBuffer();
    const response = await putObjectWithTimeout({
      uploadUrl,
      headers: {
        Authorization: `OSS ${config.accessKeyId}:${signature}`,
        "Content-Type": file.type,
        Date: date,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const responseText = await response.text();
      logOssUploadError({
        config,
        endpoint,
        status: response.status,
        responseText,
      });

      return jsonError(
        `OSS 上传失败，状态码 ${response.status}。请检查 Bucket、Region、AccessKey 权限和 Public Base URL。`,
        502,
      );
    }
  } catch (error) {
    logOssUploadError({ config, endpoint, error });

    if (error instanceof Error && error.name === "AbortError") {
      return jsonError(
        `OSS 上传超时，已超过 ${ossUploadTimeoutMs / 1000} 秒。请检查服务器到 OSS endpoint 的网络、Region 和 Bucket 配置。`,
        504,
      );
    }

    return jsonError(
      error instanceof Error
        ? `OSS 上传请求失败：${error.name || "Error"} ${error.message}`
        : "OSS 上传请求失败，请检查网络和 OSS 配置。",
      502,
    );
  }

  return NextResponse.json({
    ok: true,
    url: getPublicUrl(config.publicBaseUrl, objectKey),
    objectKey,
  });
}
