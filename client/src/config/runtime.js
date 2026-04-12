function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function getBrowserLocation() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location;
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function getApiBaseUrl() {
  const location = getBrowserLocation();
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_API_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (!location) {
    return "/api";
  }

  return isLocalHost(location.hostname) ? "/api" : `${trimTrailingSlash(location.origin)}/api`;
}

export function getSocketUrl() {
  const location = getBrowserLocation();
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL);

  if (configuredUrl) {
    return configuredUrl;
  }

  if (!location) {
    return "";
  }

  return trimTrailingSlash(location.origin);
}
