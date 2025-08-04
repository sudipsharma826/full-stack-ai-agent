# AI Ticket Platform - Frontend

A modern React application for AI-powered ticket management system with role-based access control.

## 🚀 Features

### Authentication & Authorization
- **User Signup/Login** with JWT authentication
- **Role-based Access Control** (Admin, Moderator, User)
- **Persistent Authentication** using Zustand with local storage
- **Protected Routes** based on user roles

### Ticket Management
- **Create Tickets** with title and description
- **AI-Powered Assignment** based on user skills
- **Ticket Status Tracking** (Open, In-Progress, Resolved, Closed)
- **Priority Levels** (High, Medium, Low)
- **Real-time Updates** and status monitoring

### User Management (Admin/Moderator)
- **View All Users** with search and filtering
- **Update User Information** including skills and roles
- **Role Management** (Admin only)
- **Skills-based Matching** for ticket assignment

### Dashboard & Analytics
- **Personal Dashboard** with ticket statistics
- **Recent Tickets** overview
- **Quick Actions** for common tasks
- **Role-specific Navigation** and features

### Modern UI/UX
- **Responsive Design** with Tailwind CSS
- **Clean Interface** with intuitive navigation
- **Loading States** and error handling
- **AdSense Integration** ready placeholders

## 🛠️ Tech Stack

- **React 19.1.0** - Frontend framework
- **React Router DOM** - Client-side routing
- **Zustand** - State management with persistence
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Build tool and development server

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout.jsx          # Main layout with navigation and AdSense
│   ├── Navigation.jsx      # Top navigation bar
│   ├── ProtectedRoute.jsx  # Route protection based on roles
│   └── index.js           # Component exports
├── pages/
│   ├── Login.jsx          # Login page
│   ├── Signup.jsx         # User registration
│   ├── Dashboard.jsx      # Main dashboard
│   ├── CreateTicket.jsx   # Ticket creation form
│   ├── TicketDetails.jsx  # Individual ticket view
│   ├── Tickets.jsx        # User's tickets list
│   ├── AllTickets.jsx     # All tickets (Admin/Moderator)
│   ├── Users.jsx          # User management (Admin/Moderator)
│   ├── UpdateUser.jsx     # User update form (Admin/Moderator)
│   └── index.js           # Page exports
├── store/
│   └── useUserStore.js    # Zustand store for user state
├── utils/
│   └── api.js             # Axios configuration and API calls
├── App.jsx                # Main app component with routing
└── main.jsx               # Application entry point
```

## 🔗 API Integration

The frontend integrates with the backend API using the following endpoints:

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

### Tickets
- `POST /tickets` - Create new ticket
- `GET /tickets` - Get user's tickets (or all for admin/moderator)
- `GET /tickets/:id` - Get specific ticket details

### Users (Admin/Moderator only)
- `GET /users` - Get all users
- `PUT /update` - Update user information

## 🔐 User Roles & Permissions

### User
- Create and view own tickets
- Update own profile information
- Access personal dashboard

### Moderator
- All User permissions
- View all tickets in the system
- View all users
- Update user information (not roles)

### Admin
- All Moderator permissions
- Update user roles
- Full system management access

## 🎨 UI Components & Features

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Responsive navigation and layouts
- Optimized for various screen sizes

### Interactive Elements
- Real-time form validation
- Loading states with spinners
- Success/error notifications
- Hover effects and transitions

### AdSense Integration
- Placeholder components ready for AdSense
- Multiple ad placement options
- Responsive ad containers

## 🔄 State Management

### Zustand Store Features
- **Persistent Authentication** - User stays logged in
- **User Information** - Profile, role, and permissions
- **Token Management** - JWT token handling
- **Auto-logout** - On token expiration

### API Integration
- **Axios Interceptors** - Automatic token attachment
- **Error Handling** - Global error responses
- **Base URL Configuration** - Environment-based API URLs

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Backend API running on localhost:3000

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # .env file
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Backend Requirements
Ensure your backend API is running with the following routes:
- Authentication endpoints (`/signup`, `/login`, `/logout`)
- Ticket management (`/tickets/*`)
- User management (`/users`, `/update`)

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Configuration
- **Development**: Uses Vite dev server on port 5173
- **Production**: Built static files ready for deployment
- **API**: Configurable backend URL via environment variables

## 📱 Features Overview

### Authentication Flow
1. **Landing Page** - Login form for existing users
2. **Signup** - Registration with email, password, and skills
3. **Auto-redirect** - Authenticated users go to dashboard
4. **Persistent Sessions** - Users stay logged in across browser sessions

### Ticket Workflow
1. **Create Ticket** - Simple form with title and description
2. **AI Processing** - Backend AI assigns tickets based on skills
3. **Status Updates** - Real-time status tracking
4. **Detailed View** - Complete ticket information and history

### Admin Features
1. **User Management** - Complete user overview and editing
2. **Ticket Oversight** - View and manage all system tickets
3. **Role Assignment** - Update user permissions and access levels


## 🎯 Production Ready

### Performance Optimizations
- **Code Splitting** - Lazy loading of routes
- **Bundle Optimization** - Vite production builds
- **Asset Optimization** - Minified CSS and JavaScript

### Security Features
- **Protected Routes** - Role-based access control
- **Token Security** - Automatic token expiration handling
- **Input Validation** - Client-side form validation
- **XSS Protection** - Safe HTML rendering

### Deployment Ready
- **Environment Variables** - Production configuration support
- **Static Builds** - Ready for CDN deployment
- **AdSense Integration** - Placeholder components ready for ads

## 🤝 Backend Integration

This frontend is designed to work with the AI Ticket Assistant backend. Key integration points:

- **JWT Authentication** - Secure token-based auth
- **RESTful APIs** - Standard HTTP methods and responses
- **Role-based Data** - Different data based on user permissions
- **Real-time Updates** - Polling for ticket status changes

## 📝 Notes

- All API calls use the `VITE_BACKEND_URL` environment variable
- Zustand store persists user data in localStorage
- Tailwind CSS provides responsive, modern styling
- AdSense placeholders are ready for actual ad implementation
- Error boundaries and loading states provide smooth UX+ Vite

