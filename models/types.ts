export type TimeSlot = {
    tooSoon: any;
    time: string;
    userId: string | null;
    userName?: string | null;
    booked?: boolean;
    service?: string | null;
    bookedAt?: string | null;
    canceledAt?: string | null;
    isPast?: boolean;
    enabled?: boolean;
  };
  
export type Schedule = {
    _id: string;
    date: string;
    timeSlots: TimeSlot[];
    
};

export type User = {
    [x: string]: React.ReactNode;
    _id: string;
    name?: string;
    email?: string;
    isAdmin?: boolean;
    isBanned?: boolean;
    strikes?: number;
    whatsappPhone?: string;
    whatsappVerified?: boolean;
    accountRole?: string; 
    googleAccessToken?: string;
};

export type UserAppointment = {
    timeSlots: any;
    date: string;
    time: string;
    service: string;
};

export type LogEntry = {
    _id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    actionType: string;
    additionalInfo: string;
    importance: string;
    timestamp: string;
};

export type LogSummary = {
    totalLogs: number;
    importantLogs: number;
    actionCounts: {
        reservations: number;
        cancellations: number;
    };
    importantCancellations: number;
};

