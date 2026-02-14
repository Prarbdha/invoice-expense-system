# Invoice & Expense Management System

A full-stack web application for managing invoices, expenses, clients, and financial reporting.

## 🚀 Features

- **Authentication** - Secure user registration and login
- **Client Management** - Add, edit, and manage clients
- **Invoice Generation** - Create professional invoices with PDF export
- **Expense Tracking** - Track expenses with receipt uploads
- **Payment Recording** - Record and track payments
- **Financial Reports** - Profit & Loss, Tax Summary, Client Reports
- **Email Notifications** - Send invoices and payment reminders
- **Dashboard Analytics** - Real-time business insights

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts (for analytics)
- Lucide React (icons)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Nodemailer (email)
- PDFKit (PDF generation)
- Multer (file uploads)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## 🔧 Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/invoice-expense-system.git
cd invoice-expense-system
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# Update DATABASE_URL, JWT_SECRET, and email settings

# Run database migrations
npx prisma migrate deploy

# Start server
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Update VITE_API_URL if needed

# Start development server
npm run dev
```

## 🐳 Docker Deployment

### Run with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 📱 Usage

1. Register a new account
2. Complete your company profile in Settings
3. Add clients
4. Create and send invoices
5. Track expenses
6. Record payments
7. Generate reports

## 🌐 Deployment

### Frontend (Vercel)
- Push to GitHub
- Import project in Vercel
- Deploy

### Backend Options
- Railway
- Render
- AWS EC2
- DigitalOcean

## 📄 License

MIT

## 👥 Author

Your Name - [@yourusername](https://github.com/yourusername)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.