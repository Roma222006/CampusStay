/**
 * Skeleton.jsx
 * Shimmer skeleton loader components for cards and table rows.
 */

import React from 'react';

export function SkeletonCard({ height = 120 }) {
  return (
    <div className="skeleton-card" style={{ height }} aria-hidden="true">
      <div className="skeleton-shimmer" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="skeleton-row" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="skeleton-line" style={{ width: i === 0 ? '70%' : `${55 + (i * 7) % 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCards({ count = 6, height = 140 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={height} />
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
