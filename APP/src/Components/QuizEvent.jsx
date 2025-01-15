import React from "react";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react"; // React wrapper
import dayGridPlugin from "@fullcalendar/daygrid"; // DayGrid plugin
import timeGridPlugin from "@fullcalendar/timegrid"; // TimeGrid plugin
import { API_URL } from "./Urls";
import { Link } from "react-router-dom";

const QuizEvent = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/all_quizzes`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setEvents(Array.isArray(data.quizzes) ? data.quizzes : []);
      setLoading(false);
      console.log(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    console.log(events);
  }, [events]);

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height={350} // Set height to 350px
        width={350} // Set width to 350px
        contentHeight="auto" // Disable scrolling
        timeZone="UTC" // Set timeZone to UTC
        events={events.map((event) => {
          const formattedDate = new Date(event.start_date).toISOString();
          console.log(
            `Event: ${event.title}, Start Date: ${event.start_date}, Formatted Date: ${formattedDate}`
          );
          return {
            title: event.title,
            start: formattedDate, // Ensure date format is ISO string
            id: event.id, // Add event ID
          };
        })}
        eventContent={(info) => (
          <Link to={`/quiz/${info.event.id}`}>{info.event.title}</Link>
        )}
      />
    </>
  );
};

export default QuizEvent;
