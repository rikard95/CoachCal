import { useEffect, useState } from "react";
import { auth } from "../firebase";
import DeleteAccount from "./DeleteAccount";
import {
  Container,
  Button,
  Form,
  Modal,
  Accordion,
  Row,
  Col,
} from "react-bootstrap";
import type { Event, CalendarEvent, Booking } from "../types";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/calendar.css";
import { sendBookingAcceptedEmail } from "../utils/email";
import { sendEventUpdatedEmail } from "../utils/email";
import { coachDashboardService } from "../services/coachDashboardService";

export default function CoachDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    time: "",
    start: "",
    end: "",
  });
  const [allBookings, setAllBookings] = useState<
    { event: Event; booking: Booking }[]
  >([]);
  const [bookingsDropdownOpen, setBookingsDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const uid = auth.currentUser!.uid;

  useEffect(() => {
    const unsubscribe = coachDashboardService.subscribeToEvents(
      uid,
      (eventData) => {
        setEvents(eventData);
        const bookings: { event: Event; booking: Booking }[] = [];
        eventData.forEach((e) =>
          e.bookings?.forEach((b) => bookings.push({ event: e, booking: b }))
        );
        setAllBookings(bookings);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!editingEvent?.id) return;
    const unsub = coachDashboardService.subscribeToSingleEvent(
      uid,
      editingEvent.id,
      (updatedEvent) => {
        setEditingEvent(updatedEvent);
      }
    );
    return () => unsub();
  }, [editingEvent?.id, uid]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const openModal = (event?: Event, dateStr?: string) => {
    if (event) {
      setEditingEvent(event);
      setNewEvent({
        title: event.title,
        description: event.description || "",
        time: event.time,
        start: event.start || event.time,
        end: event.end || event.time,
      });
    } else if (dateStr) {
      const start = `${dateStr}T10:00`,
        end = `${dateStr}T11:00`;
      setNewEvent({ title: "", description: "", time: start, start, end });
      setEditingEvent(null);
    } else {
      setNewEvent({ title: "", description: "", time: "", start: "", end: "" });
      setEditingEvent(null);
    }
    setShowModal(true);
  };

  const handleSaveEvent = async () => {
    if (editingEvent?.id) {
      const prevBookings = editingEvent.bookings || [];
      await coachDashboardService.updateEvent(uid, editingEvent.id, newEvent);
      if (prevBookings.length > 0) {
        await sendEventUpdatedEmail(prevBookings, {
          ...editingEvent,
          ...newEvent,
        });
      }
    } else {
      await coachDashboardService.addEvent(uid, newEvent);
    }
    setNewEvent({ title: "", description: "", time: "", start: "", end: "" });
    setEditingEvent(null);
    setShowModal(false);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!event.id) return;
    await coachDashboardService.deleteEvent(uid, event.id);
    setShowModal(false);
  };

  const updateBooking = async (
    event: Event,
    index: number,
    status: "accepted" | "declined"
  ) => {
    if (!event.id || !event.bookings) return;
    const updated = [...event.bookings];
    updated[index].status = status;
    await coachDashboardService.updateBookings(uid, event.id, updated);
    if (status === "accepted") {
      sendBookingAcceptedEmail(updated[index], event);
    }
  };

  const updateAllBookings = async (
    event: Event,
    status: "accepted" | "declined"
  ) => {
    if (!event.id || !event.bookings) return;
    const updated = event.bookings.map((b) => ({ ...b, status }));
    await coachDashboardService.updateBookings(uid, event.id, updated);

    if (editingEvent?.id === event.id)
      setEditingEvent({ ...editingEvent, bookings: updated });
    if (status === "accepted") {
      sendEventUpdatedEmail(updated, event);
    }
  };

  const calendarEvents: CalendarEvent[] = events.map((e, idx) => ({
    id: e.id! + `-${idx}`,
    title: e.title,
    start: e.start || e.time,
    end: e.end || e.time,
    extendedProps: {
      description: e.description || "",
      bookings: e.bookings || [],
    },
  }));

  const groupedBookings = allBookings.reduce(
    (
      acc: Record<string, { event: Event; bookings: Booking[] }>,
      { event, booking }
    ) => {
      if (!acc[event.id!]) acc[event.id!] = { event, bookings: [] };
      acc[event.id!].bookings.push(booking);
      return acc;
    },
    {}
  );

  return (
    <Container fluid className="px-3 px-md-4 mt-3">
      <Row className="align-items-center mb-3 justify-content-between">
        <Col
          xs={12}
          md="auto"
          className="text-center text-md-start mb-2 mb-md-0"
        >
          <h2 className="m-0">Coach Dashboard</h2>
        </Col>
        <Col
          xs={12}
          md="auto"
          className="d-flex justify-content-center justify-content-md-end"
        >
          <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
            <span
              className="fw-semibold text-truncate"
              style={{ maxWidth: 260 }}
            >
              {auth.currentUser?.email || "No user"}
            </span>
            <Button variant="warning" onClick={handleLogout}>
              Log out
            </Button>
            <DeleteAccount />
          </div>
        </Col>
      </Row>

      <Row className="mb-3 justify-content-center">
        <Col xs={12} md={4}>
          <Button onClick={() => openModal()} className="w-100">
            Add Event
          </Button>
        </Col>
      </Row>

      {allBookings.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-2 text-center text-md-start">All Bookings</h5>
          <div className="d-none d-md-block mb-3">
            <div className="dropdown w-50 mx-auto">
              <button
                className="btn btn-secondary dropdown-toggle w-100 text-start"
                onClick={() => setBookingsDropdownOpen(!bookingsDropdownOpen)}
                aria-expanded={bookingsDropdownOpen}
              >
                View Bookings
              </button>
              {bookingsDropdownOpen && (
                <ul
                  className="dropdown-menu show p-2 w-100"
                  style={{ maxHeight: 420, overflowY: "auto" }}
                >
                  {Object.values(groupedBookings).map(
                    ({ event, bookings }, idx) => (
                      <li key={`${event.id}-${idx}`} className="mb-2">
                        <div
                          className="booking-card"
                          onClick={() => openModal(event)}
                          role="button"
                        >
                          <strong className="booking-email">
                            {event.title}
                          </strong>{" "}
                          ({bookings.length} booking
                          {bookings.length > 1 ? "s" : ""})
                          <ul className="mt-2 ps-3 mb-0">
                            {bookings.map((b, i) => (
                              <li
                                key={`${event.id}-booking-${i}`}
                                className="mb-1"
                              >
                                <strong>{b.clientEmail}</strong> –{" "}
                                <span className="booking-status">
                                  {b.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="d-block d-md-none">
            <Accordion flush>
              {Object.values(groupedBookings).map(
                ({ event, bookings }, idx) => (
                  <Accordion.Item eventKey={String(idx)} key={event.id}>
                    <Accordion.Header>
                      <div className="d-flex justify-content-between align-items-center w-100">
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%",
                          }}
                        >
                          <strong>{event.title}</strong>
                        </div>
                        <small className="text-muted">
                          {bookings.length} booking
                          {bookings.length > 1 ? "s" : ""}
                        </small>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body className="p-0">
                      <div className="p-3">
                        {bookings.map((b, i) => (
                          <div
                            key={`${event.id}-mobile-booking-${i}`}
                            className="mb-2 booking-card"
                          >
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                              <div>
                                <strong className="booking-email">
                                  {b.clientEmail}
                                </strong>
                                <div className="booking-status">
                                  Status: {b.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="primary"
                          className="w-100 mt-2"
                          onClick={() => openModal(event)}
                        >
                          Open event
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                )
              )}
            </Accordion>
          </div>
        </div>
      )}

      <div className="calendar-wrapper mb-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          height="auto"
          contentHeight="auto"
          aspectRatio={1.0}
          eventClick={(info) => {
            const e = events.find(
              (ev) => ev.id === info.event.id.split("-")[0]
            );
            if (e) openModal(e);
          }}
          selectable
          editable={false}
          dayMaxEvents
          dateClick={(info) => openModal(undefined, info.dateStr)}
          eventContent={(arg) => {
            const event = events.find(
              (e) => e.id === arg.event.id.split("-")[0]
            );
            if (!event) return null;
            const startTime = new Date(arg.event.start!);
            const endTime = arg.event.end ? new Date(arg.event.end) : null;

            return (
              <div
                style={{
                  fontSize: "0.75rem",
                  lineHeight: 1.2,
                  whiteSpace: "normal",
                  overflow: "visible",
                  wordBreak: "break-word",
                  textAlign: "center",
                }}
              >
                <b>{arg.event.title}</b>
                {arg.event.extendedProps.description && (
                  <div style={{ fontSize: "0.65rem", color: "#000000ff" }}>
                    {arg.event.extendedProps.description}
                  </div>
                )}
                <div style={{ fontSize: "0.65rem", color: "#000000ff" }}>
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {endTime
                    ? ` – ${endTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </div>
              </div>
            );
          }}
        />
      </div>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingEvent ? "Edit Event" : "Add Event"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-flex flex-column gap-3">
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                placeholder="Event title"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                placeholder="Description (optional)"
              />
            </Form.Group>
            <div className="d-flex flex-column flex-md-row gap-2">
              <Form.Group className="flex-fill">
                <Form.Label>Start</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newEvent.start}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, start: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="flex-fill">
                <Form.Label>End</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newEvent.end}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, end: e.target.value })
                  }
                />
              </Form.Group>
            </div>
            <div className="d-flex gap-2 mt-2 flex-column flex-md-row justify-content-center">
              <Button onClick={handleSaveEvent} className="w-100 w-md-auto">
                Save
              </Button>
              {editingEvent && (
                <Button
                  variant="danger"
                  onClick={() => handleDeleteEvent(editingEvent)}
                  className="w-100 w-md-auto"
                >
                  Delete
                </Button>
              )}
            </div>
          </Form>

          {editingEvent?.bookings?.length && (
            <div className="mt-4">
              <h6>Bookings:</h6>
              {editingEvent.bookings.map((b, i) => (
                <div
                  key={`${editingEvent.id}-booking-${i}`}
                  className="booking-card"
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                    <div>
                      <strong className="booking-email">{b.clientEmail}</strong>
                      <div className="booking-status">Status: {b.status}</div>
                    </div>
                    <div className="d-flex gap-2 flex-column flex-md-row mt-2 mt-md-0 w-100 w-md-auto">
                      <Button
                        size="sm"
                        variant={
                          b.status === "accepted" ? "secondary" : "success"
                        }
                        onClick={() =>
                          editingEvent &&
                          updateBooking(editingEvent, i, "accepted")
                        }
                        className="w-100 w-md-auto"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          b.status === "declined" ? "secondary" : "danger"
                        }
                        onClick={() =>
                          editingEvent &&
                          updateBooking(editingEvent, i, "declined")
                        }
                        className="w-100 w-md-auto"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1">
                    <small>Message: {b.message || "No message provided"}</small>
                  </div>
                </div>
              ))}
              <div className="d-flex gap-2 mt-2 flex-column flex-md-row justify-content-center">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() =>
                    editingEvent && updateAllBookings(editingEvent, "accepted")
                  }
                  className="w-100 w-md-auto"
                >
                  Accept All
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() =>
                    editingEvent && updateAllBookings(editingEvent, "declined")
                  }
                  className="w-100 w-md-auto"
                >
                  Decline All
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
