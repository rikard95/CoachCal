import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

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
                    Create available times, manage bookings, and get notified by
                    email.
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
                    via email.
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
                    refreshing the page.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

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
