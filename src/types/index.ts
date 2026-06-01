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
  passengerId: string;
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
