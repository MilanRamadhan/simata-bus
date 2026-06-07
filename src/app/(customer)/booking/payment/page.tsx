'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/AppContext';
import PageTransition from '@/components/shared/PageTransition';
import PassengerPayment from '@/components/customer/PassengerPayment';
import type { PassengerData, PaymentMethod } from '@/types';

export default function PaymentPage() {
  const router = useRouter();
  const { user, selectedSchedule, selectedSeat, selectedBookingDate, bookTicket, bookSeat, setSelectedSchedule, setSelectedSeat, setSelectedBookingDate } = useAppStore();

  const seatIds = selectedSeat ? selectedSeat.split(',').filter(Boolean) : [];

  useEffect(() => {
    if (!selectedSchedule || seatIds.length === 0) router.replace('/home');
  }, [selectedSchedule, seatIds.length, router]);

  const handleConfirm = useCallback((passenger: PassengerData, method: PaymentMethod) => {
    if (!selectedSchedule || seatIds.length === 0) return;

    bookSeat(selectedSchedule.id, seatIds);
    bookTicket({
      passengerId: user?.id ?? null,
      passengerName: passenger.fullName,
      passengerNik: passenger.nik,
      passengerPhone: passenger.phone,
      agencyName: selectedSchedule.agencyName,
      busName: selectedSchedule.busName,
      busClass: selectedSchedule.busClass,
      origin: selectedSchedule.origin,
      destination: selectedSchedule.destination,
      date: selectedBookingDate || selectedSchedule.date,
      departureTime: selectedSchedule.departureTime,
      arrivalTime: selectedSchedule.arrivalTime,
      seatNumber: seatIds.join(', '),
      price: selectedSchedule.price * seatIds.length,
      paymentMethod: method,
      status: 'Lunas',
    });

    setSelectedSchedule(null);
    setSelectedSeat('');
    setSelectedBookingDate(null);
    router.push('/history');
  }, [selectedSchedule, seatIds, user, bookTicket, bookSeat, setSelectedSchedule, setSelectedSeat, router]);

  if (!selectedSchedule || seatIds.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <PageTransition pageKey="payment">
        <PassengerPayment
          schedule={selectedSchedule}
          seatIds={seatIds}
          user={user}
          onConfirm={handleConfirm}
          onBack={() => router.push('/booking/seat')}
        />
      </PageTransition>
    </AnimatePresence>
  );
}
