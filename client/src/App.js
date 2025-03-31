import React, { useState, useEffect } from 'react';
import FlightForm from './components/FlightForm';
import FlightList from './components/FlightList';
import EventForm from './components/EventForm';
import EventList from './components/EventList';

console.log('[FILE USED] /client/src/App.js');

function App() {
  const [flights, setFlights] = useState([]);
  const [events, setEvents] = useState([]);
  const [lastFlightUpdate, setLastFlightUpdate] = useState(null);
  const [lastEventUpdate, setLastEventUpdate] = useState(null);
  const [isUpdatingFlights, setIsUpdatingFlights] = useState(false);
  const [isUpdatingEvents, setIsUpdatingEvents] = useState(false);

  useEffect(() => {
    fetchFlights();
    fetchEvents();
  }, []);

  // Flight-related functions
  const fetchFlights = async () => {
    try {
      console.log('Fetching flights...');
      const response = await fetch('/api/flights');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from flights API: ${response.status} - ${errorText}`);
        return; // Don't update state if we got an error response
      }
      
      const data = await response.json();
      console.log('Fetched flights:', data);
      
      if (Array.isArray(data)) {
        setFlights(data);
        setLastFlightUpdate(new Date());
      } else {
        console.error('Unexpected data format from flights API:', data);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
      // Continue with current state - don't clear existing flights on error
    }
  };

  const addFlight = async (newFlight) => {
    try {
      console.log('Adding flight:', newFlight);
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlight)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from flights API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Add flight response:', data);
      
      // Update the flights state with the new data
      if (data.success && data.flights) {
        setFlights(data.flights);
        setLastFlightUpdate(new Date());
      }
      return data;
    } catch (error) {
      console.error('Error adding flight:', error);
      // Return a standardized error response object
      return { 
        success: false, 
        message: 'Failed to connect to server. Please try again later.',
        error: error.message
      };
    }
  };

  const deleteFlight = async (index) => {
    try {
      console.log('Deleting flight at index:', index);
      const response = await fetch(`/api/flights/${index}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from flights API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Delete flight response:', data);
      
      if (data.success && data.flights) {
        setFlights(data.flights);
        setLastFlightUpdate(new Date());
      } else {
        throw new Error(data.message || 'Failed to delete flight');
      }
    } catch (error) {
      console.error('Error deleting flight:', error);
      alert('Error deleting flight. Please try again.');
    }
  };

  const updateVestaboardWithFlights = async () => {
    try {
      console.log('Updating Vestaboard with flights...');
      setIsUpdatingFlights(true);
      
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flights })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from flights API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Update Vestaboard with flights response:', data);
      
      if (data.success) {
        setLastFlightUpdate(new Date());
        alert('Vestaboard updated with flights successfully');
      } else {
        alert('Failed to update Vestaboard with flights: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating Vestaboard with flights:', error);
      alert('Error updating Vestaboard with flights. Please try again.');
    } finally {
      setIsUpdatingFlights(false);
    }
  };

  // Event-related functions
  const fetchEvents = async () => {
    try {
      console.log('Fetching events...');
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from events API: ${response.status} - ${errorText}`);
        return; // Don't update state if we got an error response
      }
      
      const data = await response.json();
      console.log('Fetched events:', data);
      
      if (Array.isArray(data)) {
        setEvents(data);
        setLastEventUpdate(new Date());
      } else {
        console.error('Unexpected data format from events API:', data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      // Continue with current state - don't clear existing events on error
    }
  };

  const addEvent = async (newEvent) => {
    try {
      console.log('Adding event:', newEvent);
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from events API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Add event response:', data);
      
      // Update the events state with the new data
      if (data.success && data.events) {
        setEvents(data.events);
        setLastEventUpdate(new Date());
      }
      return data;
    } catch (error) {
      console.error('Error adding event:', error);
      // Return a standardized error response object
      return { 
        success: false, 
        message: 'Failed to connect to server. Please try again later.',
        error: error.message
      };
    }
  };

  const deleteEvent = async (index) => {
    try {
      console.log('Deleting event at index:', index);
      const response = await fetch(`/api/events/${index}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from events API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Delete event response:', data);
      
      if (data.success && data.events) {
        setEvents(data.events);
        setLastEventUpdate(new Date());
      } else {
        throw new Error(data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  const updateVestaboardWithEvents = async () => {
    try {
      console.log('Updating Vestaboard with events...');
      setIsUpdatingEvents(true);
      
      // Check if we have events to update
      if (!events || events.length === 0) {
        alert('No events available to send to Vestaboard');
        setIsUpdatingEvents(false);
        return;
      }
      
      // Make sure each event has the required fields
      for (const event of events) {
        if (!event.date || !event.time || !event.description) {
          alert('Some events are missing required fields (date, time, or description)');
          setIsUpdatingEvents(false);
          return;
        }
      }
      
      // Send first event to Vestaboard since API expects a single event
      const eventToSend = events[0];
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventToSend,
          updateVestaboardOnly: true  // Flag to indicate we're just updating the Vestaboard
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from events API: ${response.status} - ${errorText}`);
        alert(`Failed to update Vestaboard: ${errorText}`);
        setIsUpdatingEvents(false);
        return;
      }
      
      const data = await response.json();
      console.log('Update Vestaboard with events response:', data);
      
      if (data.success) {
        setLastEventUpdate(new Date());
        alert('Vestaboard updated with events successfully');
      } else {
        alert('Failed to update Vestaboard with events: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating Vestaboard with events:', error);
      alert('Error updating Vestaboard with events. Please try again later.');
    } finally {
      setIsUpdatingEvents(false);
    }
  };

  // Helper functions for formatting
  const formatUpdateTime = (time) => {
    if (!time) return 'Never';
    
    return time.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>VBT Vesta Portal</h1>
      </header>
      
      <div className="dashboard">
        {/* Left side - Flights */}
        <div className="panel flights-panel">
          <h2>Flight Management</h2>
          <div className="status-section">
            <p>Last Vestaboard flight update: {formatUpdateTime(lastFlightUpdate)}</p>
            <p className="note">
              (Limited to 5 flights. Newest entries will replace oldest ones.)
            </p>
            <button 
              onClick={updateVestaboardWithFlights} 
              disabled={isUpdatingFlights || flights.length === 0}
              className="submit-btn"
            >
              {isUpdatingFlights ? 'Updating...' : 'Update Vestaboard with Flights'}
            </button>
          </div>
          <FlightForm addFlight={addFlight} />
          <FlightList 
            flights={flights} 
            deleteFlight={deleteFlight}
          />
        </div>
        
        {/* Right side - Events */}
        <div className="panel events-panel">
          <h2>Event Management</h2>
          <div className="status-section">
            <p>Last Vestaboard event update: {formatUpdateTime(lastEventUpdate)}</p>
            <p className="note">
              (Limited to 5 events. Newest entries will replace oldest ones.)
            </p>
            <button 
              onClick={updateVestaboardWithEvents} 
              disabled={isUpdatingEvents || events.length === 0}
              className="submit-btn"
            >
              {isUpdatingEvents ? 'Updating...' : 'Update Vestaboard with Events'}
            </button>
          </div>
          <EventForm addEvent={addEvent} />
          <EventList 
            events={events} 
            deleteEvent={deleteEvent}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
