import React from 'react';

function BirthdayList({ birthdays, deleteBirthday }) {
  if (!birthdays || birthdays.length === 0) {
    return (
      <div className="list-container">
        <p className="no-items">No birthdays have been added yet.</p>
      </div>
    );
  }

  const formatDate = (date) => {
    // Check if the date matches today's date
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${month}/${day}`;
    
    const isToday = date === todayFormatted;
    
    return (
      <span className={isToday ? 'date-today' : ''}>
        {date} {isToday && '(TODAY!)'}
      </span>
    );
  };

  return (
    <div className="list-container">
      <h3 className="list-title">Saved Birthdays</h3>
      <ul className="item-list">
        {birthdays.map((birthday, index) => (
          <li key={birthday._id || index} className="list-item">
            <div className="item-details">
              <span className="item-primary">
                {birthday.firstName}
              </span>
              <span className="item-secondary">
                {formatDate(birthday.date)}
              </span>
            </div>
            <button 
              className="delete-btn"
              onClick={() => deleteBirthday(birthday._id)}
              aria-label={`Delete ${birthday.firstName}'s birthday`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BirthdayList;
