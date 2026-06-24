export const API_BASE_PATH = '/api' as const;

export const API_VERSION = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = (typeof API_VERSION)[keyof typeof API_VERSION];

export const SUPPORTED_API_VERSIONS = Object.values(API_VERSION);

export function apiVersionBasePath(version: ApiVersion): string {
  return `${API_BASE_PATH}/${version}`;
}
