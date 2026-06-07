"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import PageTransition from "@/components/shared/PageTransition";
import CustomerHome from "@/components/customer/CustomerHome";
import type { BusSchedule } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { setSelectedSchedule, setSelectedSeat } = useAppStore();

  const handleSelectSchedule = (s: BusSchedule) => {
    setSelectedSchedule(s);
    setSelectedSeat("");
    router.push("/booking/seat");
  };

  return (
    <AnimatePresence mode="wait">
      <PageTransition pageKey="home">
        <CustomerHome onSelectSchedule={handleSelectSchedule} />
      </PageTransition>
    </AnimatePresence>
  );
}
