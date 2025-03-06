export interface Schedule {
    _id?: string;
    barberId: string;
    date: string; // Ex: "2025-03-10"
    timeSlots: { time: string; booked: boolean }[]; // Ex: [{ time: "09:00", booked: false }]
  }