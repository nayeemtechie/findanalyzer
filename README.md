# E-commerce Search Application

A modern React application that demonstrates how to create a search interface for an e-commerce platform using search API responses.

## Features

- 🔍 Real-time search functionality
- 📱 Responsive design for mobile and desktop
- 🔄 Product filtering by brands and size units
- 📄 Pagination support
- ⚡ Built with Vite for fast development
- 🎨 Styled with Tailwind CSS
- 📦 Component-based architecture

## Prerequisites

Make sure you have the following installed on your MacBook:

- Node.js (v16 or higher)
- npm or yarn
- Git (optional)

## Installation Steps

1. **Create project directory**
   ```bash
   mkdir ecommerce-search
   cd ecommerce-search
   ```

2. **Initialize the project**
   ```bash
   npm init -y
   ```

3. **Create the project structure**
   Create the following directories:
   ```bash
   mkdir -p src/components src/hooks src/services src/data
   ```

4. **Copy all the provided files**
   - Copy `package.json` and replace the existing one
   - Create `index.html` in the root directory
   - Create `tailwind.config.js` in the root directory
   - Create `vite.config.js` in the root directory
   - Create all files in the `src` directory as shown above

5. **Install dependencies**
   ```bash
   npm install
   ```

6. **Install additional dependencies**
   ```bash
   npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
   ```

## Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:5173` (Vite's default port)

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
ecommerce-search/
├── src/
│   ├── components/
│   │   ├── SearchHeader.jsx    # Search input component
│   │   ├── FilterSidebar.jsx   # Filter sidebar with facets
│   │   ├── ProductGrid.jsx     # Product cards display
│   │   └── Pagination.jsx      # Pagination controls
│   ├── hooks/
│   │   └── useSearch.js        # Custom hook for search logic
│   ├── services/
│   │   └── searchApi.js        # API service (currently mocked)
│   ├── data/
│   │   └── mockData.js         # Mock data from the API response
│   ├── App.jsx                 # Main application component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles
├── index.html                  # HTML template
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind configuration
├── vite.config.js            # Vite configuration
└── README.md                  # This file
```

## Customization

### Connecting to Real API

To connect to your actual search API, modify `src/services/searchApi.js`:

1. Replace the mock data with actual API calls
2. Update the API endpoint URL
3. Add your API key or authentication headers

Example:
```javascript
export const searchProducts = async (query, filters, page) => {
  const response = await fetch(`/api/search?query=${query}&page=${page}`, {
    headers: {
      'Authorization': `Bearer ${yourApiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

### Styling

The application uses Tailwind CSS. You can customize the design by:

1. Modifying the Tailwind configuration in `tailwind.config.js`
2. Adding custom styles in `src/index.css`
3. Updating component classes directly

## Troubleshooting

### Common Issues

1. **Port already in use**: If port 5173 is busy, Vite will automatically try the next available port
2. **Module not found**: Make sure all dependencies are installed with `npm install`
3. **Build fails**: Clear npm cache with `npm cache clean --force` and reinstall

### Getting Help

If you encounter any issues:
1. Check the browser console for error messages
2. Ensure all files are in the correct locations
3. Verify that all dependencies are properly installed

## License

MIT License