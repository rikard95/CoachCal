import { useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
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
import DeleteAccount from "./DeleteAccount";
import { clientDashboardService } from "./../services/clientDashboardService";

export default function ClientDashboard() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coachEvents, setCoachEvents] = useState<Record<string, Event[]>>({});
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filteredCoachEvents, setFilteredCoachEvents] = useState<
    { coach: Coach; event: Event | null }[]
  >([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [resultsDropdownOpen, setResultsDropdownOpen] = useState(false);
  const [allBookings, setAllBookings] = useState<
    { coachName: string; event: Event }[]
  >([]);

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
    let eventUnsubs: (() => void)[] = [];

    const unsubscribeCoaches = clientDashboardService.subscribeToCoaches(
      (all) => {
        setCoaches(all);
        setFilteredCoachEvents(all.map((coach) => ({ coach, event: null })));

        eventUnsubs.forEach((u) => u());
        eventUnsubs = [];

        all.forEach((coach) => {
          const unsub = clientDashboardService.subscribeToCoachEvents(
            coach.id!,
            (list) => {
              setCoachEvents((prev) => {
                const updatedCoachEvents = { ...prev, [coach.id!]: list };
                const results: { coach: Coach; event: Event | null }[] = [];

                all.forEach((c) => {
                  const evs = updatedCoachEvents[c.id!] || [];
                  if (evs.length > 0) {
                    evs.forEach((e) => results.push({ coach: c, event: e }));
                  } else {
                    results.push({ coach: c, event: null });
                  }
                });

                setFilteredCoachEvents(results);
                if (selectedCoach?.id === coach.id) {
                  setEvents(list);
                }
                return updatedCoachEvents;
              });
            }
          );
          eventUnsubs.push(unsub);
        });
      }
    );

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
          bookings.push({
            coachName: coach.companyName ? coach.companyName : coach.name,
            event: e,
          });
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

    const newBooking: Booking = {
      clientEmail: currentUserEmail,
      status: "pending",
      message,
      clientName: "",
    };

    await clientDashboardService.addBooking(
      selectedCoach.id,
      selectedEvent.id,
      newBooking
    );

    setShowModal(false);
    setMessage("");
    setFeedback("Booking request sent. waiting for confirmation.");
    setTimeout(() => setFeedback(""), 5000);
  };

  const handleCancelBooking = async (event: Event) => {
    if (!selectedCoach?.id || !event.id) return;

    const myBooking = event.bookings?.find(
      (b) => b.clientEmail === currentUserEmail
    );

    if (myBooking) {
      await clientDashboardService.removeBooking(
        selectedCoach.id,
        event.id,
        myBooking
      );
      setShowModal(false);
      setFeedback("Booking cancelled.");
      setTimeout(() => setFeedback(""), 5000);
    }
  };

  const jumpToEvent = (event: Event) => {
    const coachOwner = coaches.find((c) =>
      coachEvents[c.id!]?.some((e) => e.id === event.id)
    );

    if (coachOwner) {
      setSelectedCoach(coachOwner);
      setEvents(coachEvents[coachOwner.id!] ?? []);
    }

    setSelectedEvent(event);
    setShowModal(true);

    setTimeout(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        if (event.time) {
          calendarApi.gotoDate(new Date(event.time));
          calendarApi.changeView("dayGridMonth");
        }
      }
    }, 100);
  };

  const calendarEvents: CalendarEvent[] = events.map((e, idx) => ({
    id: `${e.id}-${idx}`,
    title: e.title,
    start: e.time,
    end: e.end || undefined,
    extendedProps: {
      description: e.description || "",
      bookings: e.bookings || [],
    },
  }));

  return (
    <Container className="mt-4 mb-5">
      <Row className="align-items-center mb-3 justify-content-between">
        <Col
          xs={12}
          md="auto"
          className="text-center text-md-start mb-2 mb-md-0"
        >
          <h2 className="m-0">Client Dashboard</h2>
        </Col>
        <Col
          xs={12}
          md="auto"
          className="d-flex justify-content-center justify-content-md-end"
        >
          <div className="d-flex gap-2 align-items-center flex-wrap justify-content-center">
            <span className="fw-semibold text-truncate user-email">
              {currentUserEmail}
            </span>
            <Button variant="warning" onClick={handleLogout}>
              Log out
            </Button>
            <DeleteAccount />
          </div>
        </Col>
      </Row>

      <div className="search-container mb-4 position-relative">
        <InputGroup>
          <Form.Control
            placeholder="Search for coach or specific event..."
            value={search}
            onChange={(e) => {
              handleSearch(e as React.ChangeEvent<HTMLInputElement>);
              setResultsDropdownOpen(true);
            }}
            onFocus={() => setResultsDropdownOpen(true)}
          />
          <Button
            variant="primary"
            onClick={() => setResultsDropdownOpen(!resultsDropdownOpen)}
            className="d-flex align-items-center"
          >
            <span className="me-1">
              {resultsDropdownOpen ? "Close" : "View All"}
            </span>
            <i
              className={`bi ${
                resultsDropdownOpen ? "bi-chevron-up" : "bi-chevron-down"
              }`}
            ></i>
          </Button>
        </InputGroup>

        {resultsDropdownOpen && (
          <div className="search-results-dropdown shadow-lg border rounded bg-white">
            {filteredCoachEvents.length > 0 ? (
              <div className="list-group list-group-flush">
                {filteredCoachEvents.map(({ coach, event }, idx) => {
                  const booking = event?.bookings?.find(
                    (b) => b.clientEmail === currentUserEmail
                  );
                  const status = booking?.status || "default";

                  return (
                    <button
                      key={`${coach.id}-${event?.id}-${idx}`}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3"
                      onClick={() => {
                        handleSelectCoach(coach);
                        if (event) jumpToEvent(event);
                        setResultsDropdownOpen(false);
                      }}
                    >
                      <div className="text-start">
                        <div className="fw-bold text-dark">
                          {coach.companyName || coach.name || "Name is missing"}
                        </div>
                        {event && (
                          <div className="small mt-1">
                            <span
                              className={`badge badge-status-${status} me-1`}
                            >
                              {status === "default"
                                ? "Available"
                                : status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                            </span>
                            <span className="text-muted">{event.title}</span>
                          </div>
                        )}
                      </div>
                      <i className="bi bi-chevron-right text-muted"></i>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted italic">
                No results match your search...
              </div>
            )}
          </div>
        )}
      </div>

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
              const eventData = events.find(
                (e) => e.id === info.event.id.split("-")[0]
              );
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
          {feedback && <Alert variant="info">{feedback}</Alert>}
        </div>
      ) : (
        <div className="text-center text-muted py-5">
          <p className="fs-5">Search for a coach to see available sessions.</p>
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
                      {event.time &&
                        new Date(event.time).toLocaleString("en-US", {
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

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold">
            {selectedEvent?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <>
              <p>{selectedEvent.description}</p>
              {selectedEvent.time && (
                <p className="mb-3">
                  <strong>Time:</strong>{" "}
                  {new Date(selectedEvent.time).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {selectedEvent.end &&
                    ` – ${new Date(selectedEvent.end).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}`}
                </p>
              )}

              {selectedEvent.bookings?.some(
                (b) => b.clientEmail === currentUserEmail
              ) ? (
                <>
                  <div className="mb-2">
                    <strong>Status:</strong>{" "}
                    {
                      selectedEvent.bookings.find(
                        (b) => b.clientEmail === currentUserEmail
                      )?.status
                    }
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
