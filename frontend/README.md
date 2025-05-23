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

- **Next.js**: React framework with App Router for routing and server components
- **React.js**: Frontend library for building the user interface
- **Context API**: For state management
- **Axios**: For API requests to the backend
- **Tailwind CSS**: For styling components
- **React Hook Form**: For form handling and validation
- **Framer Motion**: For animations and transitions

## Getting Started

### Prerequisites

- Node.js (v16.0.0 or later)
- npm (v8.0.0 or later)

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

3. Create a `.env.local` file in the root directory with the following:
    ```
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will open in your browser at `http://localhost:3000`.

## Project Structure

```
frontend/
├── app/                  # Next.js App Router routes
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # Dashboard routes
│   ├── (marketing)/      # Marketing routes
│   ├── layout.jsx        # Root layout
│   └── page.jsx          # Root page
├── components/           # Shared React components
│   ├── auth/             # Authentication components
│   ├── common/           # Common UI components
│   ├── layout/           # Layout components
│   ├── marketing/        # Marketing components
│   ├── product/          # Product components
│   ├── project/          # Project components
│   └── ui/               # UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions, services, and contexts
│   ├── api/              # API utilities
│   ├── auth/             # Authentication utilities
│   ├── contexts/         # Context providers
│   ├── services/         # Service modules
│   └── utils/            # Utility functions
├── public/               # Static assets
├── styles/               # Global styles
├── .env                  # Environment variables
└── package.json          # Dependencies and scripts
```

## Building for Production

To create a production build:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

## Linting

Run linting:
```bash
npm run lint
```

## Naming Conventions

- Components: kebab-case.jsx with PascalCase component names
- Utilities: kebab-case.js with camelCase function names
- Hooks: use-kebab-case.js with camelCase hook names
- Contexts: kebab-case-context.jsx with PascalCase context names

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.