/**
 * Pagination.jsx
 * Reusable pagination component with ellipsis for large page counts.
 * Props: currentPage, totalPages, onPageChange
 */

import React from 'react';

function getPages(current, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 4) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('...');
  pages.push(total);
  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = getPages(currentPage, totalPages);

  return (
    <nav className="cs-pagination" aria-label="Pagination">
      <button
        className="cs-pagination__btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <i className="fa-solid fa-chevron-left" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="cs-pagination__ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`cs-pagination__btn ${p === currentPage ? 'cs-pagination__btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        className="cs-pagination__btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </nav>
  );
}
