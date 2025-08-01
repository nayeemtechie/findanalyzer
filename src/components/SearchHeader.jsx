export const SearchHeader = () => {
  return (
    <div className="py-4 border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-4">
            <img 
              src="src/images/algonomy-min.png" 
              alt="Find Logo" 
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex-grow">Find Response Analyzer</h1>
        </div>
      </div>
    </div>
  );
};