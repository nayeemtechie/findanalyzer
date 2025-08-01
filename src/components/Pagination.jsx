import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ currentPage, totalResults, onPageChange }) => {
  const resultsPerPage = 10;
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="mt-8 flex justify-center">
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
            currentPage === 1 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="sr-only">Previous</span>
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {[...Array(Math.min(3, totalPages))].map((_, index) => {
          const page = index + 1;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                page === currentPage
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
            currentPage === totalPages 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="sr-only">Next</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};