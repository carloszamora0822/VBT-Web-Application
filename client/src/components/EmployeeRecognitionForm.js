import React, { useState } from 'react';

function EmployeeRecognitionForm({ addEmployeeRecognition }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Submit data to parent component
      const result = await addEmployeeRecognition({ 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        updateVestaboard: false
      });
      
      if (result.success) {
        // Clear form on success
        setFirstName('');
        setLastName('');
      } else {
        setError(result.message || 'Failed to add employee recognition');
      }
    } catch (error) {
      console.error('Error submitting employee recognition:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Add Employee Recognition</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="employee-first-name">First Name:</label>
          <input
            id="employee-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="employee-last-name">Last Name:</label>
          <input
            id="employee-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
            disabled={isSubmitting}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Employee Recognition'}
        </button>
      </form>
    </div>
  );
}

export default EmployeeRecognitionForm;
