# Velora Circle

**Velora Circle** is a secure company communication platform designed for private conversations, team collaboration, and controlled information sharing.

The application provides authenticated messaging, private circles, role-based access control, secure authentication, real-time communication, and privacy-focused conversation management.

---

## 🚀 Features

### 🔐 Authentication & Security

* User registration and login
* JWT-based authentication
* Password hashing
* Protected API routes
* Token validation and expiration handling
* Input validation using Zod
* Role-Based Access Control (RBAC)
* Login rate limiting
* Secure access to protected resources

### 💬 Private Messaging

* One-to-one conversations
* Private Circle conversations
* Send and receive messages
* Persistent message storage
* Message validation
* Conversation history
* Real-time communication support

### 👥 Private Circles

* Create private circles
* Add members to circles
* Circle-based conversations
* Privacy-focused member visibility
* Circle members cannot freely view other members' information
* Administrative access to circle membership

### 📞 Communication

* Real-time communication using Socket.IO
* Voice/video calling functionality
* Incoming call notifications
* Call signaling through WebSockets

### 👤 User & Role Management

* User authentication
* User roles
* Admin-controlled functionality
* Protected administrative routes
* Permission-based API access

---

## 🛡️ Security Layer

Velora Circle includes multiple security mechanisms:

```text
                Velora Circle
                     │
                     ▼
             JWT Authentication
                     │
                     ▼
             Password Hashing
                     │
                     ▼
              Input Validation
                     │
                     ▼
            Role-Based Access
                     │
                     ▼
              Rate Limiting
                     │
                     ▼
          Protected API Routes
```

The backend validates authentication and authorization before allowing access to protected resources.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────┐
│          Frontend           │
│        React + TSX          │
│                             │
│  Login • Home • Circles     │
│  Messages • Files • Admin   │
└──────────────┬──────────────┘
               │
               │ HTTP / REST API
               ▼
┌─────────────────────────────┐
│           Backend           │
│       Node.js + Express     │
│                             │
│ Auth • Users • Conversations│
│ Messages • Circles • Calls  │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   MongoDB        Socket.IO
   Database       Real-time
                  Communication
```

---

## 🧰 Technology Stack

### Frontend

* React
* TypeScript / TSX
* TanStack Router
* Lucide Icons
* Sonner
* REST API integration

### Backend

* Node.js
* Express.js
* TypeScript / TSX
* MongoDB
* Mongoose
* Socket.IO
* JWT
* Zod
* Password hashing
* Rate limiting

### Development Tools

* Git
* GitHub
* npm
* Postman
* Visual Studio Code

---

## 📁 Project Structure

```text
Veloracircle-main/
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── config/
│   └── server.ts
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── routes/
│       ├── router.tsx
│       └── ...
│
├── docs/
│
├── .gitignore
└── README.md
```

---

## 🔄 Application Flow

```text
User
 │
 ▼
Login / Registration
 │
 ▼
JWT Authentication
 │
 ▼
Protected Application
 │
 ├───────────────┐
 ▼               ▼
Home          Messages
 │               │
 ▼               ▼
Circles       Conversations
 │               │
 ▼               ▼
Members        Messages
 │
 ▼
Admin Controls
```

---

## 💬 Messaging Flow

```text
User
  │
  │ Send Message
  ▼
Frontend
  │
  │ POST /api/messages
  ▼
Express API
  │
  ├── Authentication Check
  ├── Authorization Check
  ├── Input Validation
  │
  ▼
Message Controller
  │
  ▼
MongoDB
  │
  ▼
Stored Message
```

---

## 🔒 Privacy Model

Velora Circle is designed with privacy as an important part of the application architecture.

For private circles:

* Circle membership information is protected.
* Regular members do not have unrestricted access to the member directory.
* Administrative users have controlled access to membership information.
* Protected API endpoints verify the authenticated user's permissions.

This helps prevent unnecessary exposure of participant information.

---

## 🧪 API Testing

The backend APIs can be tested using **Postman**.

Example authentication flow:

```text
Register
   ↓
Login
   ↓
Receive JWT
   ↓
Use JWT in Authorization Header
   ↓
Access Protected APIs
```

Example protected request:

```text
Authorization: Bearer <JWT_TOKEN>
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/PURNIMASHAH12/Veloracircle-main.git
cd Veloracircle-main
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit your `.env` file to GitHub.

### 4. Start the backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

### 6. Start the frontend

```bash
npm start
```

The frontend will run on the configured development port.

---

## 🔑 Environment Variables

| Variable     | Description                        |
| ------------ | ---------------------------------- |
| `PORT`       | Backend server port                |
| `MONGO_URI`  | MongoDB connection string          |
| `JWT_SECRET` | Secret used for JWT authentication |

> Never upload real credentials, database URLs, API keys, or JWT secrets to GitHub.

---

## 🧪 Testing

The application APIs can be tested using Postman.

Important test cases include:

* User registration
* User login
* Invalid login credentials
* JWT validation
* Expired/invalid token
* Protected route access
* Role-based access
* Circle creation
* Circle membership access
* Conversation creation
* Message sending
* Message retrieval
* Message validation
* Rate limiting

---

## 📌 Current Project Status

Velora Circle is an ongoing full-stack project.

Implemented functionality includes:

* Authentication
* JWT authorization
* Password hashing
* Input validation
* Rate limiting
* User management
* Private circles
* Role-based permissions
* One-to-one conversations
* Message persistence
* REST APIs
* Socket.IO communication
* Calling functionality

Additional features and improvements may be added as development continues.

---

## 🎯 Project Goals

The main goals of Velora Circle are to:

* Build a privacy-focused communication platform
* Practice secure full-stack application development
* Implement authentication and authorization correctly
* Learn real-time communication
* Work with REST APIs and WebSockets
* Build scalable backend architecture
* Apply software security concepts in a practical project

---

## 👩‍💻 Developer

**Purnima Shah**

BSc CSIT Student
Full-Stack Development | MERN Stack | Backend & Web Security

---

## 📄 License

This project is developed for educational and portfolio purposes.
