import emailjs from "@emailjs/browser";
import type { Event, Booking } from "../types";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_EVENT;
const EVENT_UPDATED_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_EVENT_UPDATED_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;



export async function sendBookingAcceptedEmail(
    booking: Booking,
    event: Event
) {
    const eventTime = new Date(event.time).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const eventEnd = event.end
        ? new Date(event.end).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

    return emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
            to_email: booking.clientEmail,
            event_title: event.title,
            event_description: event.description || "",
            event_time: eventTime,
            event_end: eventEnd,   
            status: booking.status,
        },
        PUBLIC_KEY
    );
}

export async function sendEventUpdatedEmail(
    bookings: Booking[],
    event: Event
) {
    const eventTime = new Date(event.time).toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const eventEnd = event.end
        ? new Date(event.end).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

        const acceptedBookings = bookings.filter(b => b.status === 'accepted');

    const promises = acceptedBookings.map((b) =>
        emailjs.send(
            SERVICE_ID,
            EVENT_UPDATED_TEMPLATE_ID,
            {
                to_email: b.clientEmail,
                event_title: event.title,
                event_description: event.description || "",
                event_time: eventTime, 
                event_end: eventEnd,  
                status: b.status,
            },
            PUBLIC_KEY
        )
    );
    return Promise.all(promises);
}
