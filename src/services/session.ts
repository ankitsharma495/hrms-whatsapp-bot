export interface SessionData {
  employee_id: number | null;
  name: string | null;
  step: string | null;
  temp: Record<string, any>;
}

const sessions = new Map<string, SessionData>();

function createDefaultSession(): SessionData {
  return {
    employee_id: null,
    name: null,
    step: null,
    temp: {},
  };
}

export function getSession(phone: string): SessionData {
  if (!sessions.has(phone)) {
    sessions.set(phone, createDefaultSession());
  }
  return sessions.get(phone)!;
}

export function setSession(phone: string, data: Partial<SessionData>): void {
  const current = getSession(phone);
  sessions.set(phone, { ...current, ...data });
}

export function clearSession(phone: string): void {
  sessions.delete(phone);
}
