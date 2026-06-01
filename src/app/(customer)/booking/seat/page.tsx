'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/AppContext';
import PageTransition from '@/components/shared/PageTransition';
import SeatSelection from '@/components/customer/SeatSelection';

export default function SeatPage() {
  const router = useRouter();
  const { selectedSchedule, setSelectedSeat } = useAppStore();

  useEffect(() => {
    if (!selectedSchedule) router.replace('/home');
  }, [selectedSchedule, router]);

  if (!selectedSchedule) return null;

  return (
    <AnimatePresence mode="wait">
      <PageTransition pageKey="seat">
        <SeatSelection
          schedule={selectedSchedule}
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
