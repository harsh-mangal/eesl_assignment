import { api } from '../api/client';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2']);

function getApiOrigin() {
  const baseUrl = String(api.defaults.baseURL ?? '').trim();
  if (!baseUrl) return '';

  try {
    return new URL(baseUrl).origin;
  } catch {
    return baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
}

/**
 * Converts backend-managed image URLs into a URL reachable from the device.
 *
 * Local uploads are sometimes persisted as http://localhost:<port>/uploads/...
 * by the backend. On an Android emulator or a physical phone, localhost points
 * to the phone itself. For managed /uploads paths we therefore reuse the
 * configured API origin (for example http://10.0.2.2:4001 or a LAN address).
 */
export function resolveMediaUrl(value?: string | null, fallback = '') {
  const raw = value?.trim();
  if (!raw) return fallback;
  if (/^(data|blob|file|content):/i.test(raw)) return raw;

  const apiOrigin = getApiOrigin();

  if (raw.startsWith('/')) return apiOrigin ? `${apiOrigin}${raw}` : raw;
  if (raw.startsWith('uploads/')) return apiOrigin ? `${apiOrigin}/${raw}` : raw;

  try {
    const parsed = new URL(raw);
    const isManagedLocalUpload = parsed.pathname.startsWith('/uploads/');

    if (apiOrigin && isManagedLocalUpload) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    // A loopback URL can never be reached from a physical device. Retain the
    // path but point it at the configured API host.
    if (apiOrigin && LOOPBACK_HOSTS.has(parsed.hostname)) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return parsed.toString();
  } catch {
    return raw;
  }
}
