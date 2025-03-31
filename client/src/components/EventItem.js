import React from 'react';

function EventItem({ event, onDelete }) {
  return (
    <div className="flight-item">
      <p>
        <strong>Date:</strong> {event.date} | <strong>Description:</strong> {event.description}
      </p>
      <button onClick={onDelete} className="delete-btn">Delete</button>
    </div>
  );
}

export default EventItem;
