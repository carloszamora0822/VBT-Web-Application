import React, { useState } from 'react';

function BirthdayForm({ addBirthday }) {
  const [firstName, setFirstName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!date.trim()) {
      setError('Date is required');
      return;
    }
    
    // Validate date format (MM/DD)
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
    if (!dateRegex.test(date.trim())) {
      setError('Date must be in MM/DD format (e.g., 04/21)');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Submit data to parent component
      const result = await addBirthday({ 
        firstName: firstName.trim(),
        date: date.trim(),
        updateVestaboard: false
      });
      
      if (result.success) {
        // Clear form on success
        setFirstName('');
        setDate('');
      } else {
        setError(result.message || 'Failed to add birthday');
      }
    } catch (error) {
      console.error('Error submitting birthday:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Add Birthday</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="birthday-first-name">First Name:</label>
          <input
            id="birthday-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="birthday-date">Date (MM/DD):</label>
          <input
            id="birthday-date"
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Enter date (e.g., 04/21)"
            disabled={isSubmitting}
            maxLength={5}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Add Birthday'}
        </button>
      </form>
    </div>
  );
}

export default BirthdayForm;
