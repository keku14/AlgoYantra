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
  const configuredHost = configuredUrl ? new URL(configuredUrl, "http://placeholder.local").hostname : "";

  if (configuredUrl) {
    if (!location || isLocalHost(location.hostname) || !isLocalHost(configuredHost)) {
      return configuredUrl;
    }
  }

  if (!location) {
    return "/api";
  }

  if (isLocalHost(location.hostname)) {
    return "http://localhost:5001/api";
  }

  return `${trimTrailingSlash(location.origin)}/api`;
}

export function getSocketUrl() {
  const location = getBrowserLocation();
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL);
  const configuredHost = configuredUrl ? new URL(configuredUrl, "http://placeholder.local").hostname : "";

  if (configuredUrl) {
    if (!location || isLocalHost(location.hostname) || !isLocalHost(configuredHost)) {
      return configuredUrl;
    }
  }

  if (!location) {
    return "";
  }

  if (isLocalHost(location.hostname)) {
    return "http://localhost:5001";
  }

  return trimTrailingSlash(location.origin);
}
