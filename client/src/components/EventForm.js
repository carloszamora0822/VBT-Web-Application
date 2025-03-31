import React, { useState } from 'react';

console.log('[FILE USED] /client/src/components/EventForm.js');

function EventForm({ addEvent }) {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!month || !day || !description) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Time is optional now
    if (time) {
      // Validate time format (military time)
      const timeNum = parseInt(time);
      if (time.length !== 4 || isNaN(timeNum) || timeNum < 0 || timeNum > 2359) {
        alert("Invalid time format. Please use military time (0000-2359)");
        return;
      }
    }
    
    // Validate month and day
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      alert("Month must be between 01 and 12");
      return;
    }
    
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      alert("Day must be between 1 and 31");
      return;
    }
    
    if (description.length > 16) {
      alert("Description must be 16 characters or less");
      return;
    }

    // Format the date in MM/DD format
    const formattedMonth = monthNum.toString().padStart(2, '0');
    const formattedDay = dayNum.toString().padStart(2, '0');
    const date = `${formattedMonth}/${formattedDay}`;

    // Show loading indicator or disable submit button here if needed
    try {
      console.log('Submitting event:', { date, time, description });
      // Always send to Vestaboard automatically
      const response = await addEvent({ date, time, description, sendToVesta: true });
      console.log('Event submission result:', response);
      
      // Clear form only if addition was successful
      if (response && response.success) {
        setMonth('');
        setDay('');
        setTime('');
        setDescription('');
      } else {
        // Show specific error message from server if available
        const errorMessage = response && response.message 
          ? response.message 
          : 'Failed to add event. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      // This should rarely happen now with the improved error handling in addEvent
      console.error('Unexpected error adding event:', error);
      alert('Connection error. Please check your internet connection and try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h3>Add New Event</h3>
      <div className="form-row">
        <div className="form-group half-width">
          <label htmlFor="month">Month:</label>
          <input
            type="text"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            placeholder="MM"
            maxLength="2"
            className="narrow-input"
          />
        </div>
        <div className="form-group half-width">
          <label htmlFor="day">Day:</label>
          <input
            type="text"
            id="day"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            required
            placeholder="DD"
            maxLength="2"
            className="narrow-input"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="event-time">Time (Military, Optional):</label>
        <input
          type="text"
          id="event-time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          pattern="[0-9]{4}"
          maxLength="4"
          placeholder="(Ex. 1230)"
          className="narrow-input"
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="(Max 16 chars)"
          maxLength="16"
          className="narrow-input"
        />
      </div>
      <button type="submit" className="submit-btn">Submit Event</button>
    </form>
  );
}

export default EventForm;
