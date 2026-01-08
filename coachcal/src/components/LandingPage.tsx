import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Carousel } from "react-bootstrap";
import bild1 from "../img/bild-1.png";
import bild3 from "../img/bild-3.png";
import bild4 from "../img/bild-4.png";

const MyCarousel = () => {
  return (
    <Carousel variant="light" fade>
      <Carousel.Item style={{ height: "400px" }}>
        <img
          className="d-block w-100 h-100"
          style={{ objectFit: "cover" }}
          src={bild1}
          alt="Schedule"
        />
        <Carousel.Caption className="bg-dark bg-opacity-55 rounded">
          <h2>Schedule Effortlessly</h2>
          <p>Find events created by coaches.</p>
        </Carousel.Caption>
      </Carousel.Item>

      <Carousel.Item style={{ height: "400px" }}>
        <img
          className="d-block w-100 h-100"
          style={{ objectFit: "cover", objectPosition: "bottom" }}
          src={bild4}
          alt="Manage"
        />
        <Carousel.Caption className="bg-dark bg-opacity-55 rounded">
          <h2>Manage Clients</h2>
          <p>Keep track of all your appointments in one place.</p>
        </Carousel.Caption>
      </Carousel.Item>

      <Carousel.Item style={{ height: "400px" }}>
        <img
          className="d-block w-100 h-100"
          style={{ objectFit: "cover", objectPosition: "bottom" }}
          src={bild3}
          alt="Grow"
        />
        <Carousel.Caption className="bg-dark bg-opacity-55 rounded">
          <h2>Grow with CoachCal</h2>
          <p>The ultimate tool for coaches and clients.</p>
        </Carousel.Caption>
      </Carousel.Item>
    </Carousel>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="bg-info text-black text-center p-5">
        <Container>
          <h1 className="display-4">Welcome to CoachCal</h1>
          <p className="lead">
            Organize appointments, manage your calendar, and connect with
            coaches or clients easily.
          </p>
          <Button
            variant="light"
            className="me-3"
            onClick={() => navigate("/signup")}
          >
            Create Account
          </Button>
          <Button variant="outline-dark" onClick={() => navigate("/login")}>
            Log In
          </Button>
        </Container>
      </section>

      <section className="py-5">
        <Container>
          <h2 className="text-center mb-4">Why Choose CoachCal?</h2>
          <Row>
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>For Coaches</Card.Title>
                  <Card.Text>
                    Create available times, manage bookings, and send email
                    confirmations. Anyone can become a coach on CoachCal.
                    Whether you are a professional trainer or just starting out,
                    you can set up your profile and start creating events in
                    minutes. Manage your own schedule, accept booking requests,
                    and grow your community with ease.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>For Clients</Card.Title>
                  <Card.Text>
                    Search for coaches, book sessions, and receive confirmations
                    via email. Anyone looking to learn or grow can join as a
                    client. Simply create an account to start browsing available
                    sessions from various coaches. Find a time that fits your
                    life, book your spot instantly, and keep track of all your
                    upcoming appointments in one place.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3 shadow-sm">
                <Card.Body>
                  <Card.Title>Realtime Updates</Card.Title>
                  <Card.Text>
                    See coach availability and bookings update instantly without
                    refreshing the page. No need to sit around wondering if
                    there are any new sessions available! As soon as a coach
                    adds a new event or changes a time, you will see it on your
                    screen right away without even having to refresh the page.
                    Stay informed and never miss an opportunity to book your
                    next session.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      <MyCarousel />

      <section className="bg-light py-5 text-center">
        <Container>
          <h3>Get Started Today!</h3>
          <p>
            Create an account and start managing your appointments effortlessly.
          </p>
          <Button
            variant="primary"
            className="me-3"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Log In
          </Button>
        </Container>
      </section>
    </div>
  );
}
