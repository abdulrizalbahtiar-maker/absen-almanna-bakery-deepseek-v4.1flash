export const COOKIE_SESI = "mock_session";
export const COOKIE_ROLE = "mock_role";

export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export function setSesiMock(profileId: string, role: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 12;
  document.cookie = `${COOKIE_SESI}=${profileId}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${COOKIE_ROLE}=${role}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function hapusSesiMock() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_SESI}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${COOKIE_ROLE}=; path=/; max-age=0; samesite=lax`;
}

export function bacaCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}
