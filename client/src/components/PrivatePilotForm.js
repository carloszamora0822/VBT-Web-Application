import React, { useState } from 'react';

function PrivatePilotForm({ addPrivatePilot }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!name.trim()) {
      setError('Pilot name is required');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // Submit data to parent component
      const result = await addPrivatePilot({ name, updateVestaboard: false });
      
      if (result.success) {
        // Clear form on success
        setName('');
      } else {
        setError(result.message || 'Failed to add private pilot');
      }
    } catch (error) {
      console.error('Error submitting private pilot:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h3>New Private Pilot</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="pilot-name">Pilot Name:</label>
          <input
            id="pilot-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter pilot name"
            disabled={isSubmitting}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Private Pilot'}
        </button>
      </form>
    </div>
  );
}

export default PrivatePilotForm;
