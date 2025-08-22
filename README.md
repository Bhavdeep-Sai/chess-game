# Multiplayer Chess Game

A real-time multiplayer chess game built with React, Node.js, Socket.io, and MongoDB.

## Features

- 🎮 **Real-time multiplayer gameplay** with Socket.io
- 👤 **User authentication** (register/login) or play as guest
- 🏆 **User profiles and statistics** with ELO rating system
- 🎯 **Game rooms** - create private/public rooms with passwords
- 👥 **Spectator mode** - watch games in progress
- 💬 **Real-time chat** during games
- ⏱️ **Time controls** - various time formats (1min, 3min, 5min, 10min, etc.)
- 📱 **Responsive design** - works on desktop and mobile
- 🎨 **Beautiful UI** with Tailwind CSS
- 📊 **Game history** and move tracking
- ♔ **Complete chess rules** including check, checkmate, and move validation

## Technology Stack

### Backend
- **Node.js** with Express.js
- **Socket.io** for real-time communication
- **MongoDB** with Mongoose for data storage
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Rate limiting** and security middleware

### Frontend
- **React** with hooks and context API
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time communication
- **Axios** for HTTP requests
- **Vite** for development and building

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/chess_game
   # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/chess_game

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend will be running on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:3001/api
   VITE_SOCKET_URL=http://localhost:3001

   # Development
   VITE_NODE_ENV=development
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

   The frontend will be running on `http://localhost:5173`

## Usage

### Playing as a Registered User

1. **Register**: Create an account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Create Game**: Set up a new game room with time controls and privacy settings
4. **Join Game**: Join existing games or play against random opponents
5. **Track Progress**: View your game history, statistics, and rating

### Playing as a Guest

1. Click "Play as Guest" on the login page
2. Enter the lobby with a random guest username
3. Create or join games without registration
4. Note: Guest games don't affect ratings or save to history

### Game Features

- **Room Creation**: Choose time controls, set passwords, enable/disable spectators
- **Real-time Moves**: See opponent moves instantly
- **Chat**: Communicate with your opponent and spectators
- **Game Controls**: Resign, offer draw, request undo
- **Spectating**: Watch ongoing games with full chat access

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Games
- `GET /api/games/lobby` - Get list of available games
- `POST /api/games/create` - Create new game room
- `POST /api/games/join/:roomId` - Join game room
- `GET /api/games/:roomId` - Get game state
- `GET /api/games/user/history` - Get user's game history

## Socket Events

### Client to Server
- `join_room` - Join a game room
- `player_ready` - Mark player as ready
- `make_move` - Make a chess move
- `send_message` - Send chat message
- `resign` - Resign from game

### Server to Client
- `game_state` - Current game state
- `move_made` - Move was made
- `chat_message` - New chat message
- `player_joined` - Player joined room
- `player_disconnected` - Player left room
- `game_started` - Game began
- `game_ended` - Game finished
- `error` - Error occurred

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## Deployment

### Backend Deployment
1. Set production environment variables
2. Use a process manager like PM2
3. Set up MongoDB Atlas for database
4. Configure reverse proxy (Nginx)
5. Enable HTTPS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files with any web server
3. Update API URLs in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue on the GitHub repository.
