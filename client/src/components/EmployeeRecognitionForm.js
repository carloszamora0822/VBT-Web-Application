import React, { useState } from 'react';

function EmployeeRecognitionForm({ addEmployeeRecognition }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!name.trim()) {
      setError('Employee name is required');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Submit data to parent component
      const result = await addEmployeeRecognition({ name, updateVestaboard: false });
      
      if (result.success) {
        // Clear form on success
        setName('');
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
          <label htmlFor="employee-name">Employee Name:</label>
          <input
            id="employee-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter employee name"
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
