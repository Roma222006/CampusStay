import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = (status || 'pending').toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`status-badge ${normalized}`}>
      {status || 'Pending'}
    </span>
  );
};

export default StatusBadge;
