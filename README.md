# Linker - Underground School Community Platform

A comprehensive web platform for a proxies website and underground school community built with Next.js, featuring secure authentication, real-time chat, issue tracking, and admin management.

## 🚀 Features

### 🔐 Authentication System
- **User Registration**: Username, password, and phone number required
- **Admin Approval**: All new registrations require admin approval
- **Role-Based Access**: USER, ADMIN, and SUPER_ADMIN roles
- **Secure Sessions**: JWT-based authentication with HTTP-only cookies
- **Route Protection**: Non-registered users cannot access content

### 💬 Real-Time Global Chat System
- **Socket.io Integration**: True real-time communication with WebSocket fallback
- **Express.js Server**: Custom server with Socket.io for instant messaging
- **Live Features**: Instant message delivery, typing indicators, online user count
- **Connection Status**: Real-time connection monitoring with automatic reconnection
- **Message Persistence**: All messages are saved to database and loaded on startup
- **User Identification**: Messages show username, role badges, and timestamps
- **Modern UX**: Smooth animations, typing indicators, and connection status

### 🔧 Issues Center
- **Issue Submission**: Users can report problems with title, description, and priority
- **Admin Management**: Admins can update issue status and priority
- **Status Tracking**: OPEN, IN_PROGRESS, RESOLVED, CLOSED statuses
- **Priority Levels**: LOW, MEDIUM, HIGH, CRITICAL priorities
- **User Ownership**: Users can only see and delete their own issues

### 🔗 Proxy Links Management
- **Two Types**: "Our Proxies" (FANCY) and "Third Party" proxies
- **Static & Dynamic**: Admin-managed proxy collections
- **Status Control**: ACTIVE, INACTIVE, UNDER_REVIEW statuses
- **Admin Only**: Only admins can add, edit, or delete proxy links

### 👥 Admin Panel
- **User Management**: Approve/reject registrations, change roles, suspend users
- **Statistics Dashboard**: User counts, issue stats, chat metrics
- **Pending Approvals**: Dedicated section for new user approvals
- **Role Assignment**: SUPER_ADMIN can promote users to ADMIN
- **Activity Monitoring**: Track user activity and platform usage

### 🎨 Modern UI/UX
- **Glassmorphism Design**: White/black theme with blur effects
- **Smooth Animations**: Framer Motion animations throughout
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Modern Components**: Rounded corners, gradients, and smooth transitions

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Custom Express.js server with Socket.io
- **Real-time**: Socket.io for WebSocket communication
- **Styling**: Tailwind CSS, Framer Motion
- **Authentication**: Custom JWT implementation
- **Database**: SQLite with Prisma ORM
- **Icons**: Lucide React
- **Deployment Ready**: Production-optimized build

## 📦 Installation

1. **Clone and Setup**
   ```bash
   cd platformation
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file with:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   JWT_SECRET=your-jwt-secret-change-this-in-production
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   The server will start on http://localhost:3000 with Socket.io enabled for real-time chat.

## 🔑 Default Login Credentials

After running the seed script:

- **Super Admin**: 
  - Username: `admin`
  - Password: `admin123`

- **Demo User** (requires approval):
  - Username: `demo_user` 
  - Password: `demo123`

## 🏗 Project Structure

```
platformation/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Initial data seeding
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin panel
│   │   ├── chat/         # Global chat
│   │   ├── issues/       # Issues center
│   │   ├── proxies/      # Proxy links
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   └── page.tsx      # Dashboard
│   ├── components/
│   │   └── Navigation.tsx # Main navigation
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   └── lib/
│       ├── auth.ts       # Authentication utilities
│       ├── prisma.ts     # Database client
│       └── utils.ts      # Helper functions
├── middleware.ts         # Route protection
└── README.md
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure session management
- **Route Protection**: Middleware-based access control
- **Role-Based Permissions**: Granular access control
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 🎯 User Roles & Permissions

### USER
- Access dashboard, chat, issues, and proxies
- Create and manage own issues
- Participate in global chat
- View proxy links

### ADMIN
- All USER permissions
- Manage all issues (update status/priority)
- Add/edit/delete proxy links
- View admin panel and statistics
- Approve/reject user registrations

### SUPER_ADMIN
- All ADMIN permissions
- Promote users to ADMIN role
- Delete users (except other SUPER_ADMINs)
- Full platform management

## 🚀 Deployment

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Environment Variables**
   Update `.env` with production values:
   - Change `JWT_SECRET` and `NEXTAUTH_SECRET`
   - Update `DATABASE_URL` for production database
   - Set `NEXTAUTH_URL` to your domain

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## 🔧 Development

- **Database Reset**: `npx prisma db push --force-reset && npm run db:seed`
- **View Database**: `npx prisma studio`
- **Type Generation**: `npx prisma generate`

## 📝 Notes

- Phone verification is prepared but not implemented (Twilio integration ready)
- All routes except `/login` and `/register` require authentication
- The platform uses Socket.io for real-time communication with WebSocket support
- SQLite is used for development (easily upgradeable to PostgreSQL/MySQL)
- Custom Express.js server handles both Next.js requests and Socket.io connections

## 🤝 Contributing

This is a complete, production-ready platform for underground school communities. All major features are implemented and working, including:

✅ User authentication with admin approval  
✅ Global chat system with persistence  
✅ Issues center with admin management  
✅ Proxy links management  
✅ Comprehensive admin panel  
✅ Modern, responsive UI with animations  
✅ Complete security implementation  
✅ Role-based access control  

The platform is ready for deployment and use!