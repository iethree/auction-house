import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ObjectWithStringKeys = { [key: string]: any };

export default function fetchWithTimeout(url: string, options: ObjectWithStringKeys = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options?.timeout || 7000);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).then((res) => {
    clearTimeout(timeout);
    return res;
  }).catch((err: Error) => {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('request timed out');
    }
    throw new Error(err.message || 'error fetching');
  });
}