// ========== SIMATA – Type Definitions ==========

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer" | "provider";
}

export interface TravelAgency {
  id: string;
  name: string;
  logo: string; // emoji placeholder
  description: string;
  contact?: string;
  photos?: string;
  rating: number;
  totalBuses: number;
  routes: string[];
  ownerId?: string; // User.id dari provider yang memiliki agency ini
}

export type ScheduleStatus = "aktif" | "ditunda" | "dibatalkan";

// Override untuk tanggal spesifik pada jadwal berulang
export interface ScheduleDateOverride {
  date: string;               // "2025-06-10"
  status: ScheduleStatus;
  note: string;
  newDepartureTime?: string;
}

export interface BusSchedule {
  id: string;
  agencyId: string;
  agencyName: string;
  busName: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  totalSeats: number;
  bookedSeats: string[];
  busClass: "Ekonomi" | "Bisnis" | "Eksekutif";
  isRecurring?: boolean;
  recurringDays?: string;
  // Untuk jadwal non-berulang
  scheduleStatus?: ScheduleStatus;
  delayNote?: string;
  newDepartureTime?: string;
  // Untuk jadwal berulang — override per tanggal
  dateOverrides?: ScheduleDateOverride[];
}

export type SeatStatus = "available" | "booked" | "selected";

export interface Seat {
  id: string;
  status: SeatStatus;
}

export interface PassengerData {
  fullName: string;
  nik: string;
  phone: string;
  email: string;
}

export type PaymentMethod = "QRIS" | "Virtual Account" | "E-Wallet";
export type TransactionStatus = "Menunggu Pembayaran" | "Lunas" | "Kedaluwarsa" | "Dibatalkan";

export interface Ticket {
  id: string;
  passengerId: string | null;
  passengerName: string;
  passengerNik: string;
  passengerPhone: string;
  agencyName: string;
  busName: string;
  busClass: string;
  origin: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  seatNumber: string;
  price: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  bookingDate: string;
}

export interface Review {
  id: string;
  userId: string;
  agencyId: string;
  rating: number;
  comment?: string;
  photos?: string;
  createdAt: string;
}
