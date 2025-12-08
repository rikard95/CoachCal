import { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  Container,
  Button,
  Form,
  Modal,
  InputGroup,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import type { Coach, Event, Booking, CalendarEvent } from "../types";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/clientdashboard.css";

export default function ClientDashboard() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachEvents, setCoachEvents] = useState<Record<string, Event[]>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filteredCoachEvents, setFilteredCoachEvents] = useState<{ coach: Coach; event: Event | null; }[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [allBookings, setAllBookings] = useState<{ coachName: string; event: Event }[]>([]);

  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) setCurrentUserEmail(user.email || "");
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  useEffect(() => {
    const coachesRef = collection(db, "coaches");
    let eventUnsubs: (() => void)[] = [];

    const unsubscribeCoaches = onSnapshot(coachesRef, (coachSnap) => {
      const all = coachSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coach);
      setCoaches(all);
      setFilteredCoachEvents(all.map((coach) => ({ coach, event: null })));

      eventUnsubs.forEach((u) => u());
      eventUnsubs = [];

      all.forEach((coach) => {
        const eventsRef = collection(db, "coaches", coach.id!, "events");
        const unsub = onSnapshot(eventsRef, (snap) => {
          const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
          setCoachEvents((prev) => ({ ...prev, [coach.id!]: list }));

          if (selectedCoach?.id === coach.id) setEvents(list);

          setFilteredCoachEvents((prev) =>
            prev.map((item) =>
              item.coach.id === coach.id
                ? list.length > 0
                  ? list.map((e) => ({ coach, event: e }))
                  : [{ coach, event: null }]
                : item
            ).flat()
          );
        });
        eventUnsubs.push(unsub);
      });
    });

    return () => {
      unsubscribeCoaches();
      eventUnsubs.forEach((u) => u());
    };
  }, [selectedCoach]);

  useEffect(() => {
    const bookings: { coachName: string; event: Event }[] = [];
    Object.entries(coachEvents).forEach(([coachId, list]) => {
      const coach = coaches.find((c) => c.id === coachId);
      if (!coach) return;
      list.forEach((e) => {
        if (e.bookings?.some((b) => b.clientEmail === currentUserEmail)) {
          bookings.push({ coachName: coach.companyName || coach.name, event: e });
        }
      });
    });
    setAllBookings(bookings);
  }, [coachEvents, coaches, currentUserEmail]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearch(term);

    const results: { coach: Coach; event: Event | null }[] = [];

    coaches.forEach((coach) => {
      const nameMatch =
        coach.name?.toLowerCase().includes(term) ||
        coach.companyName?.toLowerCase().includes(term);

      const matchingEvents = (coachEvents[coach.id!] || []).filter((ev) =>
        ev.title.toLowerCase().includes(term)
      );

      if (nameMatch || matchingEvents.length > 0) {
        if (matchingEvents.length > 0) {
          matchingEvents.forEach((event) => results.push({ coach, event }));
        } else {
          results.push({ coach, event: null });
        }
      }
    });

    setFilteredCoachEvents(results);
  };

  const handleSelectCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setEvents(coachEvents[coach.id!] ?? []);
  };

  const handleBook = async () => {
    if (!selectedCoach?.id || !selectedEvent?.id) return;

    const eventDoc = doc(db, "coaches", selectedCoach.id, "events", selectedEvent.id);
    const newBooking: Booking = {
      clientEmail: currentUserEmail,
      status: "pending",
      message,
      clientName: "",
    };

    await updateDoc(eventDoc, {
      bookings: [...(selectedEvent.bookings || []), newBooking],
    });

    setShowModal(false);
    setMessage("");
    setFeedback("You are now booked for this session!");
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleCancelBooking = async (event: Event) => {
    if (!selectedCoach?.id || !event.id) return;

    const eventDoc = doc(db, "coaches", selectedCoach.id, "events", event.id);
    const updated = (event.bookings || []).filter(
      (b) => b.clientEmail !== currentUserEmail
    );

    await updateDoc(eventDoc, { bookings: updated });

    setShowModal(false);
    setFeedback("Booking cancelled.");
    setTimeout(() => setFeedback(""), 3000);
  };

  const jumpToEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      if (event.time) {
        calendarApi.gotoDate(new Date(event.time));
        calendarApi.changeView("timeGridDay");
      }
    }
  };

  const calendarEvents: CalendarEvent[] = events.map((e, idx) => ({
    id: `${e.id}-${idx}`,
    title: e.title,
    start: e.time,
    end: e.end || undefined,
    extendedProps: { bookings: e.bookings || [] },
  }));

  return (
    <Container className="mt-4 mb-5">
      <Row className="align-items-center mb-3 justify-content-between">
        <Col xs={12} md="auto" className="text-center text-md-start mb-2 mb-md-0">
          <h2 className="m-0">Client Dashboard</h2>
        </Col>

        <Col xs={12} md="auto" className="d-flex justify-content-center justify-content-md-end">
          <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
            <span className="fw-semibold text-truncate user-email">{currentUserEmail}</span>
            <Button variant="danger" onClick={handleLogout}>Log out</Button>
          </div>
        </Col>
      </Row>

      <InputGroup className="mb-4">
        <Form.Control
          placeholder="Search by name, company, or event title..."
          value={search}
          onChange={handleSearch}
        />
      </InputGroup>

      <div className="coach-list-scroll mb-4">
        {filteredCoachEvents.map(({ coach, event }, idx) => (
          <Button
            key={`${coach.id}-${event?.id}-${idx}`}
            variant={selectedCoach?.id === coach.id ? "primary" : "outline-primary"}
            onClick={() => handleSelectCoach(coach)}
            className="flex-shrink-0"
          >
            {coach.companyName || coach.name}
            {event && <> – {event.title}</>}
          </Button>
        ))}
      </div>

      {feedback && <Alert variant="info">{feedback}</Alert>}

      {selectedCoach ? (
        <div className="coach-calendar-wrapper mb-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={calendarEvents}
            height="auto"
            eventClick={(info) => {
              const eventData = events.find((e) => e.id === info.event.id.split("-")[0]);
              if (eventData) {
                setSelectedEvent(eventData);
                setShowModal(true);
              }
            }}
            editable={false}
            selectable={true}
            dayMaxEvents={true}
            eventContent={(arg) => {
              const booking = arg.event.extendedProps.bookings?.find(
                (b: Booking) => b.clientEmail === currentUserEmail
              );

              const status = booking?.status || "default";
              const viewClass = `view-${arg.view.type}`;

              return (
                <div className={`event-item event-${status} ${viewClass}`}>          
                  <span className="event-title">{arg.event.title}</span>
                  <span className="event-time">
                    {new Date(arg.event.start!).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            }}
          />
        </div>
      ) : (
        <div className="text-center text-muted py-5">
          <p className="fs-5">Choose a coach to see available sessions.</p>
        </div>
      )}

      {allBookings.length > 0 && (
        <div className="mt-5 d-flex flex-column gap-3">
          <h5>Your Bookings</h5>
          {allBookings.map(({ coachName, event }, idx) => {
            const booking = event.bookings?.find(
              (b) => b.clientEmail === currentUserEmail
            );
            return (
              <div
                key={`${event.id}-${idx}`}
                className="booking-item border rounded p-3 bg-light shadow-sm w-100"
                onClick={() => jumpToEvent(event)}
              >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 gap-md-3">
                  <div>
                    <strong>{event.title}</strong> with <em>{coachName}</em>
                    <div className="text-muted booking-time">
                      {event.time && new Date(event.time).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.end &&
                        ` – ${new Date(event.end).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                      {" – Status: " + booking?.status}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelBooking(event);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold">
            {selectedEvent?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p>{selectedEvent.description}</p>

              {selectedEvent.bookings?.some(
                (b) => b.clientEmail === currentUserEmail
              ) ? (
                <>
                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    {selectedEvent.bookings.find(
                      (b) => b.clientEmail === currentUserEmail
                    )?.status}
                  </div>
                  <Button
                    variant="outline-warning"
                    className="w-100 py-2"
                    onClick={() => handleCancelBooking(selectedEvent)}
                  >
                    Cancel Booking
                  </Button>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    className="w-100 py-2"
                    onClick={handleBook}
                  >
                    Book
                  </Button>
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
