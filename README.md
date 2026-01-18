# 🐓 Sumbo E-Sabong - Cockfighting Betting Management System

[![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-9553E9)](https://inertiajs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com)

A comprehensive web-based betting management system for e-sabong (electronic cockfighting) events. Built with modern technologies for real-time bet management, result declaration, and financial tracking across multiple user roles.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Sumbo E-Sabong** is a full-stack Progressive Web Application (PWA) designed to digitize and streamline the management of cockfighting betting operations. The system provides a complete solution for managing fights, placing bets, declaring results, and tracking financial transactions with robust role-based access control.

### Key Highlights

- 🔐 **Role-Based Authentication** - Admin, Declarator, and Teller roles with specific permissions
- 💰 **Real-Time Betting** - Live odds calculation and bet placement
- 📊 **Live Big Screen Display** - Public-facing display for ongoing fights and results
- 🎫 **Automated Ticket Generation** - Unique ticket IDs for each bet
- 📱 **Mobile-Responsive** - Optimized for desktop, tablet, and mobile devices
- ⚡ **Server-Side Rendering (SSR)** - Fast initial page loads with Inertia.js
- 🔄 **Real-Time Updates** - Instant synchronization across all user sessions
- 📈 **Comprehensive Reporting** - Financial reports, bet history, and analytics
- 🔒 **Secure Transactions** - Built-in audit logging and transaction tracking

---

## ✨ Features

### 👑 Admin Features
- **Fight Management**: Create, edit, and manage cockfights with detailed configurations
- **User Management**: Add, edit, deactivate users (Tellers & Declarators)
- **Bet Controls**: Enable/disable betting for specific sides (Meron/Wala)
- **Commission Management**: Set and adjust commission percentages per fight
- **Teller Balance Management**: Set and adjust teller cash balances
- **Settings Management**: Configure system-wide settings
- **Reports & Analytics**: View comprehensive betting reports and statistics
- **Transaction History**: Monitor all financial transactions
- **Dashboard**: Real-time overview of active fights and betting activity

### 🏆 Declarator Features
- **Result Declaration**: Declare fight results (Meron/Wala/Draw/Cancel)
- **Pending Fights**: View all fights awaiting result declaration
- **Result History**: Track all declared results
- **Fight Status Control**: Update fight status (Open/Last Call/Closed)
- **Real-Time Monitoring**: View live betting statistics

### 💵 Teller Features
- **Bet Placement**: Place bets for customers on active fights
- **Ticket Generation**: Automatic unique ticket ID for each bet
- **Balance Management**: Track personal cash balance
- **Cash In/Out**: Record cash deposits and withdrawals
- **Bet History**: View all placed bets and their outcomes
- **Live Odds Display**: Real-time odds updates
- **Cash Transfer**: Transfer funds to other tellers
- **Printer Settings**: Configure receipt printing

### 📺 Big Screen (Public Display)
- **Live Fight Display**: Show current active fight details
- **Real-Time Odds**: Display live odds for Meron, Wala, and Draw
- **Bet Totals**: Show total bets placed on each side
- **Result Announcements**: Display declared results
- **Fight Status**: Visual indicators for fight status (Open/Last Call/Closed)
- **No Authentication Required**: Public-facing display

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Inertia.js)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Admin     │  │  Declarator  │  │    Teller    │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Big Screen (Public Display)            │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↕ (Inertia.js)
┌─────────────────────────────────────────────────────────────┐
│                Backend (Laravel 12 + Fortify)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Middleware  │  │    Models    │      │
│  │  - Admin     │  │  - Auth      │  │  - Fight     │      │
│  │  - Teller    │  │  - Role      │  │  - Bet       │      │
│  │  - Declarator│  │  - Verified  │  │  - User      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↕ (Eloquent ORM)
┌─────────────────────────────────────────────────────────────┐
│                    Database (MySQL)                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐  ┌─────────┐  │
│  │Users │  │Fights│  │ Bets │  │Transaction│  │Settings │  │
│  └──────┘  └──────┘  └──────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Admin Creates Fight → Teller Places Bets → Declarator Declares Result → System Processes Payouts
         ↓                    ↓                      ↓                          ↓
    Database Update    Ticket Generated      Status Updated             Balances Updated
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12.0 (PHP 8.2+)
- **Authentication**: Laravel Fortify
- **Database**: MySQL 8.0+
- **Session Driver**: Database
- **Caching**: File-based

### Frontend
- **UI Framework**: React 19.0 with TypeScript
- **Routing**: Inertia.js 2.0 (SSR enabled)
- **Styling**: Tailwind CSS 4.0
- **Build Tool**: Vite 7.0
- **UI Components**: Radix UI, Headless UI
- **Icons**: Custom SVG icons

### DevOps & Tools
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (automated deployment)
- **Hosting**: Hostinger Shared Hosting (PHP 8.3.28)
- **Package Manager**: Composer (backend), npm (frontend)
- **Code Quality**: ESLint, Prettier, Laravel Pint
- **Testing**: Pest PHP

### Mobile
- **PWA Support**: Yes (Capacitor for Android builds)
- **Responsive Design**: Mobile-first approach

---

## 👥 User Roles

### 1. **Admin** 👑
**Responsibilities**: Complete system control and management

**Permissions**:
- Create, edit, delete fights
- Manage users (create, edit, deactivate)
- Control betting (open/close, enable/disable sides)
- Set commission rates
- Manage teller balances
- View all reports and transactions
- Configure system settings

**Dashboard Access**: `/admin/dashboard`

---

### 2. **Declarator** 🏆
**Responsibilities**: Declare fight results and manage fight status

**Permissions**:
- View all pending fights
- Declare fight results (Meron/Wala/Draw/Cancel)
- Change fight status (Open/Last Call/Closed)
- View declared results history
- No access to financial data or user management

**Dashboard Access**: `/declarator/dashboard`

---

### 3. **Teller** 💵
**Responsibilities**: Place bets for customers and manage personal cash

**Permissions**:
- Place bets on active fights
- View own bet history
- Perform cash in/out transactions
- Transfer cash to other tellers
- View own balance and statistics
- No access to other tellers' data

**Dashboard Access**: `/teller/dashboard`

---

## 🚀 Installation

### Prerequisites

- PHP 8.2 or higher
- Composer 2.x
- Node.js 20.x or higher
- MySQL 8.0 or higher
- Git

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/LeeDev428/sumbo_e-sabong.git
   cd sumbo_e-sabong
   ```

2. **Install PHP Dependencies**
   ```bash
   composer install
   ```

3. **Install Node Dependencies**
   ```bash
   npm install
   ```

4. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure Database**
   
   Edit `.env` file:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sumbo_e_sabong_db
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

6. **Run Migrations**
   ```bash
   php artisan migrate
   ```

7. **Seed Database (Optional)**
   ```bash
   php artisan db:seed
   ```
   
   This creates default users:
   - **Admin**: admin@esabong.com / password
   - **Declarator**: declarator@esabong.com / password
   - **Teller**: teller@esabong.com / password

8. **Build Frontend Assets**
   ```bash
   npm run build
   ```

9. **Start Development Server**
   ```bash
   php artisan serve
   ```
   
   Visit: `http://127.0.0.1:8000`

10. **Start Vite Dev Server (for hot reloading)**
    ```bash
    npm run dev
    ```

---

## ⚙️ Configuration

### Session Configuration

The system uses database sessions for better scalability:

```env
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

Run: `php artisan session:table` then `php artisan migrate`

### Email Configuration (Optional)

For email notifications and password resets:

```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@esabong.com
MAIL_FROM_NAME="E-Sabong System"
```

### System Settings

Configure via Admin Dashboard → Settings:
- Default commission percentage
- Minimum bet amount
- Maximum bet amount
- System maintenance mode
- And more...

---

## 📝 Usage

### Creating a Fight (Admin)

1. Login as admin
2. Navigate to "Fights" → "Create Fight"
3. Fill in fight details:
   - Fight Number
   - Meron Fighter Name
   - Wala Fighter Name
   - Initial Odds (or enable auto-odds)
   - Commission Percentage
   - Scheduled Time
4. Click "Create Fight"

### Opening Betting (Admin)

1. Go to "Fights" page
2. Find the fight
3. Click "Open Betting"
4. Tellers can now place bets

### Placing a Bet (Teller)

1. Login as teller
2. Navigate to "Place Bet"
3. Select active fight
4. Choose side (Meron/Wala/Draw)
5. Enter bet amount
6. Current odds are shown automatically
7. Click "Place Bet"
8. Print ticket for customer

### Declaring Results (Declarator)

1. Login as declarator
2. Navigate to "Pending Results"
3. Select fight to declare
4. Choose result (Meron/Wala/Draw/Cancel)
5. Add remarks (optional)
6. Click "Declare Result"
7. System automatically processes all bets and payouts

### Viewing Big Screen

Access: `https://your-domain.com/bigscreen`

No login required. Displays:
- Current active fight
- Live odds
- Total bets per side
- Fight status
- Declared results

---

## 🌐 Deployment

### Production Deployment (Hostinger)

1. **Build Assets**
   ```bash
   npm run build
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production release"
   git push origin master
   ```

3. **GitHub Actions Auto-Deploy**
   
   The system automatically deploys to Hostinger when you push to `master` branch.
   
   Configure secrets in GitHub repository:
   - `SSH_HOST`: 46.202.186.219
   - `SSH_USERNAME`: u314333613
   - `SSH_PASSWORD`: Your SSH password
   - `SSH_PORT`: 65002

4. **Manual Deploy via SSH**
   ```bash
   ssh -p 65002 u314333613@46.202.186.219
   cd /home/u314333613/domains/sabing2m.com/laravel-app
   git pull origin master
   composer install --no-dev --optimize-autoloader
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   chmod -R 775 storage bootstrap/cache
   ```

### Environment Variables (Production)

Create `.env.production` with:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sabing2m.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=u314333613_e_sabong
DB_USERNAME=u314333613_e_sabong
DB_PASSWORD=your_production_password
```

---

## 📡 API Documentation

### Public Endpoints

```
GET  /bigscreen           - Big screen display page
GET  /api/bigscreen       - Big screen API data (JSON)
```

### Teller API Endpoints

```
GET  /teller/api/fights/{fight}/odds        - Get live odds
GET  /teller/api/fights/{fight}/bet-totals  - Get bet totals
GET  /teller/api/teller/live-data          - Get teller live data
```

### Example Response: `/api/bigscreen`

```json
{
  "fight": {
    "id": 1,
    "fight_number": "001",
    "meron_fighter": "Red Rooster",
    "wala_fighter": "Blue Thunder",
    "status": "open",
    "meron_odds": 1.85,
    "wala_odds": 1.95,
    "draw_odds": 8.00,
    "total_meron_bets": 15000,
    "total_wala_bets": 12000,
    "total_draw_bets": 500
  },
  "status": "success"
}
```

---

## 🗄️ Database Schema

### Core Tables

#### `users`
- Role-based authentication
- Teller balance tracking
- Active/inactive status

#### `fights`
- Fight management
- Odds configuration
- Status tracking (scheduled → open → lastcall → closed → result_declared)
- Commission rates
- Result storage

#### `bets`
- Unique ticket IDs
- Side selection (meron/wala/draw)
- Odds at placement time
- Status tracking (active/won/lost/cancelled/refunded)
- Payout calculations

#### `transactions`
- Teller cash in/out
- Transaction history
- Remarks/notes

#### `settings`
- System-wide configurations
- Key-value storage

#### `cash_transfers`
- Teller-to-teller transfers
- Approval workflow

#### `audit_logs`
- Action tracking
- Change history
- IP address logging

See [database/ERD.md](database/ERD.md) for complete schema.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
php artisan test

# Or using Pest directly
./vendor/bin/pest

# Run with coverage
./vendor/bin/pest --coverage
```

### Writing Tests

Tests are located in `tests/` directory using Pest PHP:

```php
test('admin can create fight', function () {
    $admin = User::factory()->admin()->create();
    
    actingAs($admin)
        ->post('/admin/fights', [
            'fight_number' => '001',
            'meron_fighter' => 'Red',
            'wala_fighter' => 'Blue',
            // ...
        ])
        ->assertRedirect()
        ->assertSessionHas('success');
    
    expect(Fight::count())->toBe(1);
});
```

---

## 📂 Project Structure

```
sumbo_e-sabong/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── FightController.php
│   │   │   │   ├── UserController.php
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── BetControlController.php
│   │   │   │   ├── CommissionController.php
│   │   │   │   ├── SettingController.php
│   │   │   │   ├── TellerBalanceController.php
│   │   │   │   └── TransactionController.php
│   │   │   ├── Declarator/
│   │   │   │   └── ResultController.php
│   │   │   ├── Teller/
│   │   │   │   ├── BetController.php
│   │   │   │   ├── TransactionController.php
│   │   │   │   └── CashTransferController.php
│   │   │   └── BigScreenController.php
│   │   └── Middleware/
│   │       ├── RoleMiddleware.php
│   │       └── HandleAppearance.php
│   └── Models/
│       ├── User.php
│       ├── Fight.php
│       ├── Bet.php
│       ├── Transaction.php
│       ├── CashTransfer.php
│       ├── Setting.php
│       └── AuditLog.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── ERD.md
├── resources/
│   ├── js/
│   │   ├── layouts/
│   │   │   ├── admin-layout.tsx
│   │   │   ├── declarator-layout.tsx
│   │   │   └── teller-layout.tsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── declarator/
│   │   │   ├── teller/
│   │   │   ├── auth/
│   │   │   └── bigscreen.tsx
│   │   ├── components/
│   │   └── types/
│   ├── css/
│   │   └── app.css
│   └── views/
│       └── app.blade.php
├── routes/
│   ├── web.php
│   ├── settings.php
│   └── console.php
├── public/
│   ├── build/
│   └── index.php
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .env.example
├── .env.production
├── composer.json
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **PHP**: Follow PSR-12 standards (use `./vendor/bin/pint`)
- **TypeScript/React**: Use ESLint + Prettier (`npm run lint`)
- **Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Lee Grafil** - Initial development - [LeeDev428](https://github.com/LeeDev428)

---

## 🙏 Acknowledgments

- Laravel Framework
- React & Inertia.js communities
- Tailwind CSS
- All contributors and testers

---

## 📞 Support

For support, email: support@esabong.com

---

## 🔗 Live Demo

- **Production**: [https://sabing2m.com](https://sabing2m.com)
- **Big Screen**: [https://sabing2m.com/bigscreen](https://sabing2m.com/bigscreen)

---

## 📝 Additional Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [Implementation Summary](IMPLEMENTATION-SUMMARY.md)
- [Completed Features](COMPLETED-FEATURES.md)
- [Testing Guide](TESTING-GUIDE.md)
- [Android Build Guide](ANDROID-BUILD.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)

---

**Made with ❤️ for the e-sabong community**
