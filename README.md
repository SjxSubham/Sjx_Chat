# Sjx_ChatApp 🚀

#### Welcome to **Sjx_ChatApp**, a powerful and intuitive real-time chat application that connects people seamlessly. Built with modern technologies, Sjx_ChatApp ensures a secure, fast, and user-friendly chatting experience.

---

![WhatsApp Image 2025-01-31 at 18 50 12_3121a5a6](https://github.com/user-attachments/assets/b94ab8b7-53eb-4347-a3fe-5ef630bf59ad)

---

## Live Demo: [Sjx_ChatApp](https://sjx-chatapp.onrender.com)

---

## 🔥 Features

- [x] **Real-Time Messaging** – Powered by Socket.IO for instant chat communication.  
- [x] **Secure Authentication** – JWT-based authentication ensures user data security.  
- [x] **User-Friendly UI** – Styled with Tailwind CSS & DaisyUI for a sleek and responsive design.  
- [x] **Scalable Backend** – Built with Express.js & Node.js for efficient performance.  
- [x] **MongoDB Database** – A robust NoSQL database for storing messages and user data.  
- [x] **Fast & Lightweight** – Optimized for speed and smooth user experience.  
- [x] **Online Status** – See who's online in real-time.
- [x] **Message Notifications** – Audio notifications for new messages.
- [x] **Responsive Design** – Works perfectly on desktop and mobile devices.

---

## 🛠 Tech Stack

- ### **Frontend:** _React.js, Tailwind CSS, DaisyUI, Vite_
- ### **Backend:** _Node.js, Express.js_  
- ### **Database:** _MongoDB_  
- ### **Authentication:** _JSON Web Token (JWT)_
- ### **Real-Time Communication:** _Socket.IO_
- ### **State Management:** _Zustand_

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SjxSubham/Sjx_Chat.git
   cd Sjx_Chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend/Sjx_chat
   npm install
   cd ../..

   cd backend
   npm install
   cd ..

   npm list
   npm i
   ```

3. **Environment Setup**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp frontend/Sjx_chat/.env.example frontend/Sjx_chat/.env
   ```

4. **Configure Environment Variables**
   
   Edit `.env` file:
   ```env
   MONGO_DB_URI=mongodb://localhost:27017/chat_app
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

   Edit `frontend/Sjx_chat/.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Start the application**
   ```bash
   # Development mode (backend)
   npm run server
   
   # In a new terminal, start frontend
   cd frontend/Sjx_chat
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Build

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

---

## 📁 Project Structure

```
Sjx_Chat/
├── backend/
│   ├── controllers/          # API controllers
│   ├── db/                  # Database connection
│   ├── middleware/          # Auth middleware
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API routes
│   ├── socket/              # Socket.IO configuration
│   └── utils/               # Utility functions
├── frontend/Sjx_chat/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # React context
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   └── utils/           # Frontend utilities
│   └── public/              # Static assets
└── package.json             # Root dependencies
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run server` | Start backend in development mode |
| `npm start` | Start backend in production mode |
| `npm run build` | Build frontend for production |
| `npm run dev` | Start frontend in development mode (from frontend/Sjx_chat) |

---

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in `.env` file
   - Kill process using: `netstat -ano | findstr :5000`

2. **MongoDB connection error**
   - Ensure MongoDB is running
   - Check MONGO_DB_URI in `.env`

3. **Socket connection issues**
   - Verify VITE_SOCKET_URL in frontend `.env`
   - Check CORS settings in backend

---

*An engaging real-time chat experience with a sleek UI.*

---

## License

This project is licensed under the `GNU GENERAL PUBLIC LICENSE v3.0` - see the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📬 Contact

For any issues or suggestions, please reach out via [GitHub Issues](https://github.com/SjxSubham/Sjx_Chat/issues).

Happy chatting! 🚀
