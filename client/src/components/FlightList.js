import React from 'react';
import FlightItem from './FlightItem';

function FlightList({ flights, deleteFlight }) {
    return (
        <div className="recent-submissions">
            <h2>Recent Flights</h2>
            <div className="flights-list">
                {flights.length > 0 ? (
                    flights.map((flight, index) => (
                        <FlightItem
                            key={flight._id || index}
                            flight={flight}
                            onDelete={() => deleteFlight(flight._id)}
                        />
                    ))
                ) : (
                    <p>No flights available</p>
                )}
            </div>
        </div>
    );
}

export default FlightList;
