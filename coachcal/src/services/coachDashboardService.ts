import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Event, Booking } from "../types";

export const coachDashboardService = {
  subscribeToEvents: (uid: string, callback: (events: Event[]) => void) => {
    const eventsRef = collection(db, "coaches", uid, "events");
    return onSnapshot(eventsRef, (snapshot) => {
      const eventData = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Event)
      );
      callback(eventData);
    });
  },

  subscribeToSingleEvent: (uid: string, eventId: string, callback: (event: Event) => void) => {
    return onSnapshot(doc(db, "coaches", uid, "events", eventId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Event);
      }
    });
  },

  addEvent: async (uid: string, eventData: any) => {
    const eventsRef = collection(db, "coaches", uid, "events");
    return await addDoc(eventsRef, {
      ...eventData,
      bookings: [] as Booking[],
      time: eventData.start,
    });
  },

  updateEvent: async (uid: string, eventId: string, eventData: any) => {
    const eventDoc = doc(db, "coaches", uid, "events", eventId);
    return await updateDoc(eventDoc, {
      ...eventData,
      time: eventData.start,
    });
  },

  deleteEvent: async (uid: string, eventId: string) => {
    return await deleteDoc(doc(db, "coaches", uid, "events", eventId));
  },

  updateBookings: async (uid: string, eventId: string, bookings: Booking[]) => {
    const eventDoc = doc(db, "coaches", uid, "events", eventId);
    return await updateDoc(eventDoc, { bookings });
  }
};