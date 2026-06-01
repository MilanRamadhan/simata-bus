"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, TravelAgency, BusSchedule, Ticket, Review } from "../types";

interface AppState {
  user: User | null;
  agencies: TravelAgency[];
  schedules: BusSchedule[];
  tickets: Ticket[];
  myAgency: TravelAgency | null;
  userReviews: Review[]; // review yang sudah dikirim user yang login
  login: (email: string, password: string, role: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => void;
  addAgency: (a: Omit<TravelAgency, "id">) => void;
  updateAgency: (a: TravelAgency) => void;
  deleteAgency: (id: string) => void;
  addSchedule: (s: Omit<BusSchedule, "id">) => void;
  updateSchedule: (s: BusSchedule) => void;
  deleteSchedule: (id: string) => void;
  bookTicket: (t: Omit<Ticket, "id" | "bookingDate">) => void;
  bookSeat: (scheduleId: string, seatId: string) => void;
  addReview: (review: { agencyId: string; rating: number; comment?: string; photos?: string }) => Promise<{ ok: boolean; error?: string }>;
  selectedSchedule: BusSchedule | null;
  selectedSeat: string;
  setSelectedSchedule: (s: BusSchedule | null) => void;
  setSelectedSeat: (seat: string) => void;
}

const AppContext = createContext<AppState | null>(null);

function parseRoutes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    // double-encoded: JSON.parse lagi
    if (typeof parsed === "string") {
      const inner = JSON.parse(parsed);
      if (Array.isArray(inner)) return inner.map(String);
    }
    return [String(parsed)];
  } catch {
    // fallback: comma-separated plain string
    return raw.split(",").map((r) => r.trim()).filter(Boolean);
  }
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agencies, setAgencies] = useState<TravelAgency[]>([]);
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<BusSchedule | null>(null);
  const [selectedSeat, setSelectedSeat] = useState("");

  // Agency milik provider yang sedang login (null untuk admin/customer)
  const myAgency = user?.role === "provider"
    ? (agencies.find((a) => a.ownerId === user.id) ?? null)
    : null;

  const fetchAll = useCallback(async () => {
    try {
      const [resA, resS, resT] = await Promise.all([fetch("/api/agencies"), fetch("/api/schedules"), fetch("/api/tickets")]);
      const agg = resA.ok ? await resA.json() : [];
      const sch = resS.ok ? await resS.json() : [];
      const tkt = resT.ok ? await resT.json() : [];

      setAgencies(Array.isArray(agg) ? agg.map((a: any) => ({ ...a, routes: parseRoutes(a.routes) })) : []);
      setSchedules(Array.isArray(sch) ? sch.map((s: any) => ({ ...s, bookedSeats: JSON.parse(s.bookedSeats || "[]") })) : []);
      setTickets(Array.isArray(tkt) ? tkt : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!user) { setUserReviews([]); return; }
    fetch(`/api/reviews?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => setUserReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  const login = useCallback(async (email: string, password: string, role: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        // Check if role matches what's expected (UI checks customer vs admin)
        if (data.role === role) {
          setUser(data);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const addAgency = useCallback(async (a: Omit<TravelAgency, "id">) => {
    const res = await fetch("/api/agencies", {
      method: "POST",
      body: JSON.stringify({ ...a, routes: JSON.stringify(a.routes) }),
    });
    if (res.ok) {
      const saved = await res.json();
      setAgencies((prev) => [{ ...saved, routes: parseRoutes(saved.routes) }, ...prev]);
    }
  }, []);

  const updateAgency = useCallback(async (a: TravelAgency) => {
    const res = await fetch(`/api/agencies/${a.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...a, routes: JSON.stringify(a.routes) }),
    });
    if (res.ok) {
      setAgencies((prev) => prev.map((x) => (x.id === a.id ? a : x)));
    }
  }, []);

  const deleteAgency = useCallback(async (id: string) => {
    const res = await fetch(`/api/agencies/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgencies((prev) => prev.filter((x) => x.id !== id));
      setSchedules((prev) => prev.filter((x) => x.agencyId !== id));
    }
  }, []);

  const addSchedule = useCallback(async (s: Omit<BusSchedule, "id">) => {
    const res = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify({ ...s, bookedSeats: JSON.stringify(s.bookedSeats) }),
    });
    if (res.ok) {
      const saved = await res.json();
      setSchedules((prev) => [{ ...saved, bookedSeats: JSON.parse(saved.bookedSeats) }, ...prev]);
    }
  }, []);

  const updateSchedule = useCallback(async (s: BusSchedule) => {
    const res = await fetch(`/api/schedules/${s.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...s, bookedSeats: JSON.stringify(s.bookedSeats) }),
    });
    if (res.ok) {
      setSchedules((prev) => prev.map((x) => (x.id === s.id ? s : x)));
    }
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSchedules((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  const bookSeat = useCallback(
    async (scheduleId: string, seatIds: string | string[]) => {
      const sched = schedules.find((s) => s.id === scheduleId);
      if (!sched) return;
      const ids = Array.isArray(seatIds) ? seatIds : seatIds.split(",").filter(Boolean);
      const newSeats = [...sched.bookedSeats, ...ids];
      setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, bookedSeats: newSeats } : s)));
      await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        body: JSON.stringify({ ...sched, bookedSeats: JSON.stringify(newSeats) }),
      });
    },
    [schedules],
  );

  const bookTicket = useCallback(async (t: Omit<Ticket, "id" | "bookingDate">) => {
    const res = await fetch("/api/tickets", {
      method: "POST",
      body: JSON.stringify({ ...t, bookingDate: new Date().toISOString().slice(0, 10) }),
    });
    if (res.ok) {
      const saved = await res.json();
      setTickets((prev) => [saved, ...prev]);
    }
  }, []);

  const addReview = useCallback(
    async (review: { agencyId: string; rating: number; comment?: string; photos?: string }): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Tidak terautentikasi." };
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...review, userId: user.id }),
      });
      if (res.ok) {
        const saved = await res.json();
        setUserReviews((prev) => [saved, ...prev]);
        return { ok: true };
      }
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error || "Gagal mengirim ulasan." };
    },
    [user],
  );

  return (
    <AppContext.Provider
      value={{
        user,
        agencies,
        schedules,
        tickets,
        myAgency,
        userReviews,
        login,
        register,
        logout,
        addAgency,
        updateAgency,
        deleteAgency,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        bookTicket,
        bookSeat,
        addReview,
        selectedSchedule,
        selectedSeat,
        setSelectedSchedule,
        setSelectedSeat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
