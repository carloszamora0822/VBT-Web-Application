import React from 'react';
import EventItem from './EventItem';

function EventList({ events, deleteEvent }) {
  return (
    <div className="recent-submissions">
      <h2>Recent Events</h2>
      <div className="flights-list">
        {events.length > 0 ? (
          events.map((event, index) => (
            <EventItem
              key={event._id || index}
              event={event}
              onDelete={() => deleteEvent(event._id)}
            />
          ))
        ) : (
          <p>No events available</p>
        )}
      </div>
    </div>
  );
}

export default EventList;
