import React, { useState, useEffect } from 'react';
import FlightForm from './components/FlightForm';
import FlightList from './components/FlightList';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import EmployeeRecognitionForm from './components/EmployeeRecognitionForm';
import PrivatePilotForm from './components/PrivatePilotForm';
import BirthdayForm from './components/BirthdayForm';
import BirthdayList from './components/BirthdayList';

console.log('[FILE USED] /client/src/App.js');

function App() {
  const [flights, setFlights] = useState([]);
  const [events, setEvents] = useState([]);
  const [employeeRecognition, setEmployeeRecognition] = useState({ firstName: '', lastName: '' });
  const [privatePilot, setPrivatePilot] = useState(null);
  const [birthdays, setBirthdays] = useState([]);
  const [todaysBirthday, setTodaysBirthday] = useState(null);
  const [isBirthdayToday, setIsBirthdayToday] = useState(false);
  const [lastFlightUpdate, setLastFlightUpdate] = useState(null);
  const [lastEventUpdate, setLastEventUpdate] = useState(null);
  const [lastEmployeeUpdate, setLastEmployeeUpdate] = useState(null);
  const [lastPilotUpdate, setLastPilotUpdate] = useState(null);
  const [lastBirthdayUpdate, setLastBirthdayUpdate] = useState(null);
  const [isUpdatingFlights, setIsUpdatingFlights] = useState(false);
  const [isUpdatingEvents, setIsUpdatingEvents] = useState(false);
  const [isUpdatingEmployee, setIsUpdatingEmployee] = useState(false);
  const [isUpdatingPilot, setIsUpdatingPilot] = useState(false);
  const [isUpdatingBirthday, setIsUpdatingBirthday] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({ isLimited: false, message: "No rate limit detected" });

  useEffect(() => {
    fetchFlights();
    fetchEvents();
    fetchEmployeeRecognition();
    fetchPrivatePilot();
    fetchBirthdays();
  }, []);

  useEffect(() => {
    const fetchRateLimitStatus = async () => {
      try {
        const response = await fetch('/api/rate-limit-status');
        if (response.ok) {
          const data = await response.json();
          setRateLimitInfo(data);
        }
      } catch (error) {
        console.error('Error fetching rate limit status:', error);
      }
    };

    fetchRateLimitStatus();
    const intervalId = setInterval(fetchRateLimitStatus, 1000);
    
    return () => clearInterval(intervalId);
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

  const deleteFlight = async (id) => {
    try {
      console.log('Deleting flight with ID:', id);
      const response = await fetch(`/api/flights?id=${id}`, {
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

  const deleteEvent = async (id) => {
    try {
      console.log('Deleting event with ID:', id);
      const response = await fetch(`/api/events?id=${id}`, {
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

  // Employee Recognition functions
  const fetchEmployeeRecognition = async () => {
    try {
      console.log('Fetching employee recognition...');
      const response = await fetch('/api/employee-recognition');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from employee recognition API: ${response.status} - ${errorText}`);
        return; // Don't update state if we got an error response
      }
      
      const data = await response.json();
      console.log('Fetched employee recognition:', data);
      
      if (data && data.firstName !== undefined && data.lastName !== undefined) {
        setEmployeeRecognition(data);
        if (data.firstName || data.lastName) setLastEmployeeUpdate(new Date());
      } else {
        console.error('Unexpected data format from employee recognition API:', data);
      }
    } catch (error) {
      console.error('Error fetching employee recognition:', error);
      // Continue with current state - don't clear existing data on error
    }
  };

  const addEmployeeRecognition = async (employee) => {
    try {
      console.log('Adding employee recognition:', employee);
      const response = await fetch('/api/employee-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from employee recognition API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Add employee recognition response:', data);
      
      // Update the state with the new data
      if (data.success && data.employee) {
        setEmployeeRecognition(data.employee);
        setLastEmployeeUpdate(new Date());
      }
      return data;
    } catch (error) {
      console.error('Error adding employee recognition:', error);
      // Return a standardized error response object
      return { 
        success: false, 
        message: 'Failed to connect to server. Please try again later.',
        error: error.message
      };
    }
  };

  const updateVestaboardWithEmployee = async () => {
    try {
      console.log('Updating Vestaboard with employee recognition...');
      setIsUpdatingEmployee(true);
      
      // Check if we have employee to update
      if (!employeeRecognition || !employeeRecognition.firstName || !employeeRecognition.lastName) {
        alert('No employee recognition available to send to Vestaboard');
        setIsUpdatingEmployee(false);
        return;
      }
      
      const response = await fetch('/api/employee-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateVestaboardOnly: true  // Flag to indicate we're just updating the Vestaboard
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from employee recognition API: ${response.status} - ${errorText}`);
        alert(`Failed to update Vestaboard: ${errorText}`);
        setIsUpdatingEmployee(false);
        return;
      }
      
      const data = await response.json();
      console.log('Update Vestaboard with employee recognition response:', data);
      
      if (data.success) {
        setLastEmployeeUpdate(new Date());
        alert('Vestaboard updated with employee recognition successfully');
      } else {
        alert('Failed to update Vestaboard: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating Vestaboard with employee recognition:', error);
      alert('Error updating Vestaboard. Please try again later.');
    } finally {
      setIsUpdatingEmployee(false);
    }
  };

  // Private Pilot functions
  const fetchPrivatePilot = async () => {
    try {
      console.log('Fetching private pilot...');
      const response = await fetch('/api/private-pilot');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from private pilot API: ${response.status} - ${errorText}`);
        return; // Don't update state if we got an error response
      }
      
      const data = await response.json();
      console.log('Fetched private pilot:', data);
      
      if (data && data.name !== undefined) {
        setPrivatePilot(data);
        if (data.name) setLastPilotUpdate(new Date());
      } else {
        console.error('Unexpected data format from private pilot API:', data);
      }
    } catch (error) {
      console.error('Error fetching private pilot:', error);
      // Continue with current state - don't clear existing data on error
    }
  };

  const addPrivatePilot = async (pilot) => {
    try {
      console.log('Adding private pilot:', pilot);
      const response = await fetch('/api/private-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pilot)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from private pilot API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Add private pilot response:', data);
      
      // Update the state with the new data
      if (data.success && data.pilot) {
        setPrivatePilot(data.pilot);
        setLastPilotUpdate(new Date());
      }
      return data;
    } catch (error) {
      console.error('Error adding private pilot:', error);
      // Return a standardized error response object
      return { 
        success: false, 
        message: 'Failed to connect to server. Please try again later.',
        error: error.message
      };
    }
  };

  const updateVestaboardWithPilot = async () => {
    try {
      console.log('Updating Vestaboard with private pilot...');
      setIsUpdatingPilot(true);
      
      // Check if we have pilot to update
      if (!privatePilot || !privatePilot.name) {
        alert('No private pilot available to send to Vestaboard');
        setIsUpdatingPilot(false);
        return;
      }
      
      const response = await fetch('/api/private-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateVestaboardOnly: true  // Flag to indicate we're just updating the Vestaboard
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from private pilot API: ${response.status} - ${errorText}`);
        alert(`Failed to update Vestaboard: ${errorText}`);
        setIsUpdatingPilot(false);
        return;
      }
      
      const data = await response.json();
      console.log('Update Vestaboard with private pilot response:', data);
      
      if (data.success) {
        setLastPilotUpdate(new Date());
        alert('Vestaboard updated with private pilot successfully');
      } else {
        alert('Failed to update Vestaboard: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating Vestaboard with private pilot:', error);
      alert('Error updating Vestaboard. Please try again later.');
    } finally {
      setIsUpdatingPilot(false);
    }
  };

  // Birthday-related functions
  const fetchBirthdays = async () => {
    try {
      // First, check if there's a birthday today
      console.log('Checking for birthdays today...');
      const todayResponse = await fetch('/api/birthday?today=true');
      
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        console.log('Birthday today check result:', todayData);
        
        setIsBirthdayToday(todayData.isBirthdayToday);
        setTodaysBirthday(todayData.birthday);
        
        if (todayData.isBirthdayToday && todayData.birthday) {
          setLastBirthdayUpdate(new Date());
        }
      }
      
      // Then fetch all birthdays
      console.log('Fetching all birthdays...');
      const response = await fetch('/api/birthday');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from birthday API: ${response.status} - ${errorText}`);
        return; // Don't update state if we got an error response
      }
      
      const data = await response.json();
      console.log('Fetched birthdays:', data);
      
      if (Array.isArray(data)) {
        setBirthdays(data);
      } else {
        console.error('Unexpected data format from birthday API:', data);
      }
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      // Continue with current state - don't clear existing data on error
    }
  };

  const addBirthday = async (birthdayData) => {
    try {
      console.log('Adding birthday:', birthdayData);
      const response = await fetch('/api/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birthdayData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from birthday API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Add birthday response:', data);
      
      // Update the state with the new data
      if (data.success) {
        if (data.birthdays && Array.isArray(data.birthdays)) {
          setBirthdays(data.birthdays);
        }
        
        // If this is today's birthday, update that state too
        if (data.birthday && data.vestaboardUpdated) {
          setTodaysBirthday(data.birthday);
          setIsBirthdayToday(true);
          setLastBirthdayUpdate(new Date());
        }
        
        // Refresh today's birthday status regardless
        fetchBirthdays();
      }
      return data;
    } catch (error) {
      console.error('Error adding birthday:', error);
      // Return a standardized error response object
      return { 
        success: false, 
        message: 'Failed to connect to server. Please try again later.',
        error: error.message
      };
    }
  };
  
  const deleteBirthday = async (id) => {
    try {
      console.log('Deleting birthday with ID:', id);
      const response = await fetch(`/api/birthday?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from birthday API: ${response.status} - ${errorText}`);
        return { success: false, message: `Server error: ${response.status}` };
      }
      
      const data = await response.json();
      console.log('Delete birthday response:', data);
      
      if (data.success && data.birthdays) {
        setBirthdays(data.birthdays);
        
        // Refresh today's birthday status
        fetchBirthdays();
      } else {
        throw new Error(data.message || 'Failed to delete birthday');
      }
    } catch (error) {
      console.error('Error deleting birthday:', error);
      alert('Error deleting birthday. Please try again.');
    }
  };

  const updateVestaboardWithBirthday = async () => {
    try {
      console.log('Updating Vestaboard with today\'s birthday...');
      setIsUpdatingBirthday(true);
      
      // Check if we have a birthday today
      if (!isBirthdayToday || !todaysBirthday) {
        alert('No birthday today to send to Vestaboard');
        setIsUpdatingBirthday(false);
        return;
      }
      
      const response = await fetch('/api/birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateVestaboardOnly: true  // Flag to indicate we're just updating the Vestaboard
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from birthday API: ${response.status} - ${errorText}`);
        alert(`Failed to update Vestaboard: ${errorText}`);
        setIsUpdatingBirthday(false);
        return;
      }
      
      const data = await response.json();
      console.log('Update Vestaboard with birthday response:', data);
      
      if (data.success) {
        setLastBirthdayUpdate(new Date());
        alert('Vestaboard updated with today\'s birthday successfully');
      } else {
        alert('Failed to update Vestaboard: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating Vestaboard with birthday:', error);
      alert('Error updating Vestaboard. Please try again later.');
    } finally {
      setIsUpdatingBirthday(false);
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

  // Format full name from first and last name
  const formatFullName = (firstName, lastName) => {
    if (!firstName && !lastName) return 'None';
    return `${firstName} ${lastName}`.trim();
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>VBT Vesta Portal</h1>
        {rateLimitInfo.isLimited && (
          <div className="rate-limit-warning">
            <p>⚠️ {rateLimitInfo.message} ⚠️</p>
            {rateLimitInfo.timeRemaining && (
              <div className="countdown-timer">
                Next update available in: {rateLimitInfo.timeRemaining} seconds
              </div>
            )}
          </div>
        )}
      </header>
      
      <div className="dashboard">
        {/* Left side - Flights */}
        <div className="panel flights-panel">
          <h2>Check Ride</h2>
          <div className="status-section">
            <p className="timestamp">Last update: {formatUpdateTime(lastFlightUpdate)}</p>
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
          <h2>OZ1 Club Upcoming Events</h2>
          <div className="status-section">
            <p className="timestamp">Last update: {formatUpdateTime(lastEventUpdate)}</p>
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
      
      <div className="dashboard secondary-dashboard">
        {/* Employee Recognition Panel */}
        <div className="panel employee-panel">
          <h2>Employee Recognition</h2>
          <div className="status-section">
            <p className="timestamp">Last update: {formatUpdateTime(lastEmployeeUpdate)}</p>
            <p className="current-value">
              Current Employee: {formatFullName(employeeRecognition?.firstName, employeeRecognition?.lastName)}
            </p>
            <button 
              onClick={updateVestaboardWithEmployee} 
              disabled={isUpdatingEmployee || !employeeRecognition?.firstName || !employeeRecognition?.lastName}
              className="submit-btn"
            >
              {isUpdatingEmployee ? 'Updating...' : 'Update Vestaboard with Employee'}
            </button>
          </div>
          <EmployeeRecognitionForm addEmployeeRecognition={addEmployeeRecognition} />
        </div>
        
        {/* Private Pilot Panel */}
        <div className="panel pilot-panel">
          <h2>Private Pilot</h2>
          <div className="status-section">
            <p className="timestamp">Last update: {formatUpdateTime(lastPilotUpdate)}</p>
            <p className="current-value">
              Current Pilot: {privatePilot?.name || 'None'}
            </p>
            <button 
              onClick={updateVestaboardWithPilot} 
              disabled={isUpdatingPilot || !privatePilot?.name}
              className="submit-btn"
            >
              {isUpdatingPilot ? 'Updating...' : 'Update Vestaboard with Pilot'}
            </button>
          </div>
          <PrivatePilotForm addPrivatePilot={addPrivatePilot} />
        </div>
      </div>
      
      <div className="dashboard tertiary-dashboard">
        {/* Birthday Panel */}
        <div className="panel birthday-panel">
          <h2>Birthday Management</h2>
          <div className="status-section">
            <p className="timestamp">Last update: {formatUpdateTime(lastBirthdayUpdate)}</p>
            <p className="current-value">
              {isBirthdayToday 
                ? <strong>Today's Birthday: {todaysBirthday?.firstName} ({todaysBirthday?.date})</strong>
                : 'No birthdays today'}
            </p>
            <button 
              onClick={updateVestaboardWithBirthday} 
              disabled={isUpdatingBirthday || !isBirthdayToday}
              className="submit-btn"
            >
              {isUpdatingBirthday ? 'Updating...' : 'Update Vestaboard with Birthday'}
            </button>
          </div>
          <div className="birthday-management">
            <div className="birthday-form-section">
              <BirthdayForm addBirthday={addBirthday} />
            </div>
            <div className="birthday-list-section">
              <BirthdayList 
                birthdays={birthdays} 
                deleteBirthday={deleteBirthday}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
