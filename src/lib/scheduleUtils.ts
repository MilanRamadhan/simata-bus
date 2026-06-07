import type { BusSchedule, ScheduleDateOverride } from "@/types";

/** Kembalikan tanggal lokal sebagai "YYYY-MM-DD" — BUKAN UTC */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const DAY_MAP: Record<string, number> = {
  Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3,
  Kamis: 4, Jumat: 5, Sabtu: 6,
};

/**
 * Hitung N tanggal mendatang (termasuk hari ini, waktu lokal) untuk jadwal berulang.
 */
export function getUpcomingDates(schedule: BusSchedule, count = 14): string[] {
  if (!schedule.isRecurring || !schedule.recurringDays) return [];

  const days = schedule.recurringDays
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d in DAY_MAP)
    .map((d) => DAY_MAP[d]);

  if (days.length === 0) return [];

  const result: string[] = [];
  // Gunakan tanggal lokal, bukan UTC
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  let attempts = 0;

  while (result.length < count && attempts < 365) {
    if (days.includes(cursor.getDay())) {
      result.push(localDateStr(cursor));   // ← lokal, bukan toISOString
    }
    cursor.setDate(cursor.getDate() + 1);
    attempts++;
  }

  return result;
}

/**
 * Ambil tanggal keberangkatan berikutnya (hari ini atau masa depan, waktu lokal).
 * Return null jika jadwal sudah kedaluwarsa.
 */
export function getNextDepartureDate(schedule: BusSchedule): string | null {
  const today = localDateStr();   // ← lokal, bukan UTC

  if (!schedule.isRecurring) {
    if (!schedule.date) return null;
    return schedule.date >= today ? schedule.date : null;
  }

  const upcoming = getUpcomingDates(schedule, 7);
  return upcoming[0] || null;
}

/**
 * Apakah jadwal ini masih punya keberangkatan mendatang?
 */
export function hasUpcomingDeparture(schedule: BusSchedule): boolean {
  return getNextDepartureDate(schedule) !== null;
}

/**
 * Format tanggal "YYYY-MM-DD" ke tampilan Indonesia singkat
 */
export function formatTanggal(date: string): string {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * Format tanggal lengkap dengan nama hari penuh
 */
export function formatTanggalPanjang(date: string): string {
  if (!date) return "";
  return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Ambil override untuk tanggal tertentu
 */
export function getDateOverride(
  schedule: BusSchedule,
  date: string
): ScheduleDateOverride | undefined {
  return (schedule.dateOverrides || []).find((o) => o.date === date);
}

/**
 * Cek apakah tanggal (YYYY-MM-DD) adalah hari keberangkatan jadwal berulang
 */
export function isScheduleDay(schedule: BusSchedule, date: string): boolean {
  if (!schedule.isRecurring || !schedule.recurringDays) return false;
  const days = schedule.recurringDays
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d in DAY_MAP)
    .map((d) => DAY_MAP[d]);
  return days.includes(new Date(date + "T00:00:00").getDay());
}

/**
 * Semua tanggal dalam bulan tertentu yang merupakan hari keberangkatan
 */
export function getScheduleDaysInMonth(
  schedule: BusSchedule,
  year: number,
  month: number // 0-indexed
): string[] {
  const result: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (isScheduleDay(schedule, dateStr)) result.push(dateStr);
  }
  return result;
}
