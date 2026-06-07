'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/AppContext';
import PageTransition from '@/components/shared/PageTransition';
import SeatSelection from '@/components/customer/SeatSelection';

export default function SeatPage() {
  const router = useRouter();
  const { selectedSchedule, setSelectedSeat, agencies, selectedBookingDate } = useAppStore();

  const agency = useMemo(
    () => agencies.find((a) => a.id === selectedSchedule?.agencyId),
    [agencies, selectedSchedule]
  );

  useEffect(() => {
    if (!selectedSchedule) router.replace('/home');
  }, [selectedSchedule, router]);

  if (!selectedSchedule) return null;

  return (
    <AnimatePresence mode="wait">
      <PageTransition pageKey="seat">
        <SeatSelection
          schedule={selectedSchedule}
          agency={agency}
          bookingDate={selectedBookingDate}
          onConfirm={(seatIds) => {
            setSelectedSeat(seatIds.join(','));
            router.push('/booking/payment');
          }}
          onBack={() => router.push('/home')}
        />
      </PageTransition>
    </AnimatePresence>
  );
}
