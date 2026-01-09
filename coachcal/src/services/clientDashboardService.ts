import { db } from "../firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from "firebase/firestore";
import type { Coach, Event, Booking } from "../types";

export const clientDashboardService = {
  subscribeToCoaches: (callback: (coaches: Coach[]) => void) => {
    const coachesRef = collection(db, "coaches");
    return onSnapshot(coachesRef, (snap) => {
      const coaches = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coach));
      callback(coaches);
    });
  },

  subscribeToCoachEvents: (coachId: string, callback: (events: Event[]) => void) => {
    const eventsRef = collection(db, "coaches", coachId, "events");
    return onSnapshot(eventsRef, (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
      callback(list);
    });
  },

  addBooking: async (coachId: string, eventId: string, newBooking: Booking) => {
    const eventDoc = doc(db, "coaches", coachId, "events", eventId);
    return await updateDoc(eventDoc, {
      bookings: arrayUnion(newBooking)
    });
  },

  removeBooking: async (coachId: string, eventId: string, bookingToRemove: Booking) => {
    const eventDoc = doc(db, "coaches", coachId, "events", eventId);
    return await updateDoc(eventDoc, {
      bookings: arrayRemove(bookingToRemove)
    });
  },

  updateEventBookings: async (coachId: string, eventId: string, bookings: Booking[]) => {
    const eventDoc = doc(db, "coaches", coachId, "events", eventId);
    return await updateDoc(eventDoc, { bookings });
  }
};