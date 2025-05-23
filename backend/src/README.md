# Product Bazar Frontend

This is the frontend application for Product Bazar, a platform where makers can showcase their innovative products and users can discover, upvote, and provide feedback on these creations.

## Features

- **User Authentication**: Register, log in, and manage user profiles
- **Product Discovery**: Browse latest products in a feed format
- **Product Details**: View comprehensive information about each product
- **Interaction**: Upvote products and leave comments
- **Product Submission**: Makers can submit their products with details
- **AI Recommendations**: Discover products based on your interests and interactions

## Technologies Used

- **React.js**: Frontend library for building the user interface
- **React Router**: For navigation between different components
- **Redux/Context API**: For state management
- **Axios**: For API requests to the backend
- **CSS/SCSS**: For styling components
- **React Hook Form**: For form handling and validation

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm (v6.0.0 or later)

### Installation

1. Clone the repository
    ```bash
    git clone https://github.com/yourusername/product-bazar.git
    cd product-bazar/frontend
    ```

2. Install dependencies
    ```bash
    npm install
    ```

3. Create a `.env` file in the frontend directory with the following:
    ```
    REACT_APP_API_URL=http://localhost:5000/api
    ```

### Running the Application

Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Project Structure

```
frontend/
├── public/               # Public assets
├── src/                  # Source files
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable components
│   ├── context/          # Context API files
│   ├── pages/            # Page components
│   ├── services/         # API service files
│   ├── utils/            # Utility functions
│   ├── App.js            # Main App component
│   └── index.js          # Entry point
├── .env                  # Environment variables
└── package.json          # Dependencies and scripts
```

## Building for Production

To create a production build:
```bash
npm run build
```

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.