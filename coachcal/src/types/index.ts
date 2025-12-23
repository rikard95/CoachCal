export interface User {
  uid?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  role: "coach" | "client";
  companyName?: string;
  selectedCoach?: string;
}

export interface Booking {
  clientEmail: string;
  clientName: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  time: string;
  start?: string;
  end?: string; 

  bookings?: Booking[];
}

export interface Coach {
  id?: string;
  name: string;
  companyName?: string;
  email?: string;
  followers: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    description: string;
    bookings: Booking[];
  };
}
