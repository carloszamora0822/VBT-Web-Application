import React, { useState } from 'react';

function FlightForm({ addFlight }) {
  const [time, setTime] = useState('');
  const [callsign, setCallsign] = useState('');
  const [type, setType] = useState('PPL');
  const [destination, setDestination] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!time || !callsign || !destination) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate time format (military time)
    const timeNum = parseInt(time);
    if (time.length !== 4 || isNaN(timeNum) || timeNum < 0 || timeNum > 2359) {
      alert("Invalid time format. Please use military time (0000-2359)");
      return;
    }

    if (callsign.length > 6 || destination.length > 6) {
      alert("Name and Flight Number must be 6 characters or less");
      return;
    }

    // Show loading indicator or disable submit button here if needed
    try {
      console.log('Submitting flight:', { time, callsign, type, destination });
      const response = await addFlight({ 
        time, 
        callsign, 
        type, 
        destination,
        sendToVesta: true // Always send to Vestaboard automatically
      });
      console.log('Flight submission result:', response);
      
      // Clear form only if addition was successful
      if (response && response.success) {
        setTime('');
        setCallsign('');
        setType('PPL');
        setDestination('');
      } else {
        // Show specific error message from server if available
        const errorMessage = response && response.message 
          ? response.message 
          : 'Failed to add flight. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      // This should rarely happen now with the improved error handling in addFlight
      console.error('Unexpected error adding flight:', error);
      alert('Connection error. Please check your internet connection and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>Add New Flight</h3>
      <div className="form-group">
        <label htmlFor="time">Time (Military):</label>
        <input
          type="text"
          id="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          pattern="[0-9]{4}"
          maxLength="4"
          placeholder="(Ex. 1230)"
        />
      </div>
      <div className="form-group">
        <label htmlFor="callsign">Name:</label>
        <input
          type="text"
          id="callsign"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          required
          maxLength="6"
          placeholder="(Ex. DavidL)"
        />
      </div>
      <div className="form-group">
        <label htmlFor="type">Flight Type:</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="PPL">PPL</option>
          <option value="IFR">IFR</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="destination">Flight Tag:</label>
        <input
          type="text"
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          maxLength="6"
          placeholder="(Ex. N32851)"
        />
      </div>
      <button type="submit" className="submit-btn">Submit Flight</button>
    </form>
  );
}

export default FlightForm;
