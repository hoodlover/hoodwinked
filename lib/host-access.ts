import type { Session } from "next-auth";

export type HostAccess = {
  signedIn: boolean;
  approved: boolean;
  email: string | null;
};

export function approvedHostEmails(): Set<string> {
  return new Set(
    (process.env.APPROVED_HOST_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isApprovedHostEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return approvedHostEmails().has(email.toLowerCase());
}

export function getHostAccess(session: Session | null): HostAccess {
  const email = session?.user?.email?.toLowerCase() ?? null;
  return {
    signedIn: !!session?.user,
    approved: isApprovedHostEmail(email),
    email
  };
}
