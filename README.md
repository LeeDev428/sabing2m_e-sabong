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
- **Mobile-First Design**: Icon-based bottom navigation optimized for mobile devices
- **Bet Placement**: Place bets for customers on active fights
- **Bet Status Indicator**: Visual feedback for betting status (OPEN/CLOSED with pulsing indicators)
- **Enhanced Display Panel**: Widened bet amount display with improved number input
- **Ticket Generation**: Automatic unique ticket ID for each bet
- **QR Code Scanning**: Camera-based QR code scanning for payout claims
- **Payout Management**: One-time claim validation with comprehensive status messages
- **Balance Management**: Real-time cash balance tracking
- **Cash In/Out**: Record cash deposits and withdrawals
- **Bet History**: View all placed bets and their outcomes with filtering
- **Void Ticket Capability**: Void tickets via QR scanning before fight declaration
- **Live Odds Display**: Real-time odds updates
- **Cash Transfer**: Transfer funds to other tellers with transaction history
- **Printer Settings**: Configure Bluetooth thermal printer (PT-210) with receipt preview
- **Transaction Summaries**: Daily statistics and comprehensive bet summaries

#### Teller Mobile Features
- 🏠 **Dashboard**: Betting interface with real-time updates
- 📷 **Payout Scan**: Camera QR scanner for instant payout claims
- 📊 **History**: Merged history and summary with void capability
- 💰 **Cash Transfer**: Transfer funds between tellers
- ⚙️ **Settings**: Printer configuration and preferences

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
- **Icons**: Custom SVG icons, emoji-based navigation
- **QR Code**: qrcode.react (generation), html5-qrcode (scanning)
- **State Management**: React Hooks (useState, useEffect)

### DevOps & Tools
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (automated deployment)
- **Hosting**: Hostinger Shared Hosting (PHP 8.3.28)
- **Package Manager**: Composer (backend), npm (frontend)
- **Code Quality**: ESLint, Prettier, Laravel Pint
- **Testing**: Pest PHP

### Mobile
- **PWA Support**: Progressive Web App with offline capabilities
- **Android App**: Native Android APK builds via Capacitor
- **Responsive Design**: Mobile-first approach with touch-optimized UI
- **Bottom Navigation**: Icon-based navigation for teller role
- **Camera Integration**: QR code scanning for payouts and void tickets
- **Bluetooth Printing**: Direct printing to PT-210 thermal printers

### Android Build
- **Capacitor**: 6.x for native Android compilation
- **App ID**: com.sumbo.esabong
- **Build Type**: APK (for direct installation)
- **Target SDK**: Android 13+ (API 33)

See [APK-BUILD-GUIDE.md](APK-BUILD-GUIDE.md) and [QUICK-APK-BUILD.md](QUICK-APK-BUILD.md) for complete Android build instructions.

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
**Responsibilities**: Place bets for customers, manage payouts, and track personal cash balance

**Permissions**:
- Place bets on active fights (when betting is open)
- View real-time bet status (OPEN/CLOSED indicators)
- Scan QR codes for payout claims (one-time validation)
- Void tickets via QR scanning (before result declaration)
- View own bet history with comprehensive filters
- Perform cash in/out transactions
- Transfer cash to other tellers (with approval workflow)
- View own balance and daily statistics
- Configure Bluetooth printer settings
- Print bet receipts with QR codes
- No access to other tellers' data or admin functions

**Dashboard Access**: `/teller/dashboard`

**Mobile Features**: Bottom navigation with 5 main sections (Dashboard, Payout, History, Cash, Settings)

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

### Android App Setup (Optional)

11. **Install Capacitor Dependencies**
    ```bash
    npm install @capacitor/core @capacitor/cli @capacitor/android
    ```

12. **Build for Android**
    ```bash
    npm run build
    npx cap sync android
    npx cap open android
    ```
    
    Then build APK in Android Studio.
    
    See [APK-BUILD-GUIDE.md](APK-BUILD-GUIDE.md) for complete instructions.

### QR Code Features Setup

13. **Install QR Code Libraries** (already included)
    ```bash
    npm install qrcode.react html5-qrcode
    ```
    
    Libraries used:
    - `qrcode.react`: For generating QR codes on receipts
    - `html5-qrcode`: For camera-based QR scanning

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

## ✅ Feature Implementation Status

### Admin Features - 100% Complete
- ✅ Event-based fight filtering
- ✅ Revolving funds & petty cash tracking
- ✅ Commission percentage per fight
- ✅ User edit functionality with modal
- ✅ Commission reports by fight
- ✅ Teller performance reports
- ✅ Event dropdown for filtering
- ✅ Fight creation with financial fields
- ✅ Transaction filtering by event
- ✅ Dashboard with date range and event filters

### Teller Features - 95% Complete
- ✅ Icon-based bottom navigation (Dashboard, Payout, History, Cash, Settings)
- ✅ Bet status indicator (OPEN/CLOSED with visual feedback)
- ✅ Widened display panel and fixed 500 input bug
- ✅ Payout scanning page with camera QR scanner
- ✅ One-time claim validation
- ✅ Merged history & summary page
- ✅ Void ticket QR scanning capability
- ✅ Cash transfer with transaction history
- ✅ Printer settings with Bluetooth connection
- ✅ Real-time balance updates
- ✅ Comprehensive bet summaries
- ⏳ QR code on bet receipts (library installed, needs implementation)
- ⏳ Multi-printer compatibility (currently PT-210 only)

### Declarator Features - Pending
- ⏳ Auto-add next fight after result declaration
- ⏳ Automatic bet control (no manual Meron/Wala enable/disable)

### Big Screen Features - Pending
- ⏳ Display new fields (venue, event_name, round_number, match_type, notes)
- ⏳ Larger display for bets and odds
- ⏳ Minimalist history with colored indicators
- ⏳ Modern redesign with clean layout

### Mobile App - 90% Complete
- ✅ Capacitor configured for Android
- ✅ App ID: com.sumbo.esabong
- ✅ Assets built and synced
- ✅ Android project ready
- ✅ Camera permission handling
- ✅ Bluetooth printer integration
- ⏳ APK build in progress
- ⏳ Production testing on physical device

---

## 🚀 Deployment

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
GET  /teller/api/teller/live-data           - Get teller live data (balance)
GET  /teller/payout-scan                    - Payout scanning page
POST /teller/payout-scan/claim              - Process payout claim
GET  /teller/history                        - History and summary page
POST /teller/bets/void                      - Void a bet via QR
GET  /teller/cash-transfer                  - Cash transfer page
POST /teller/cash-transfer                  - Execute cash transfer
GET  /teller/settings/printer               - Printer settings page
```

### Admin API Endpoints

```
GET  /admin/api/events                      - Get all distinct events
GET  /admin/dashboard                       - Admin dashboard with filters
GET  /admin/reports                         - Commission and teller reports
POST /admin/users/{user}/edit               - Edit user details
POST /admin/fights/{fight}/update           - Update fight details
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
- Role-based authentication (admin/declarator/teller)
- Teller balance tracking
- Active/inactive status
- Email verification

#### `fights`
- Fight management with fight numbers
- Odds configuration (meron/wala/draw)
- Status tracking (scheduled → open → lastcall → closed → result_declared)
- Commission rates per fight
- Result storage
- Event grouping (event_date, event_name)
- Financial tracking (revolving_funds, petty_cash, fund_notes)
- Big screen fields (venue, round_number, match_type, notes, special_conditions)
- Bet control (can_accept_meron_bets, can_accept_wala_bets)

#### `bets`
- Unique ticket IDs (TKT-XXXXXXXXXX)
- Side selection (meron/wala/draw)
- Odds at placement time
- Status tracking (active/won/lost/cancelled/refunded/claimed/void)
- Payout calculations (potential_payout, actual_payout)
- Claim tracking (claimed_at, claimed_by)
- Void tracking (voided_at, voided_by)
- Teller association

#### `transactions`
- Teller cash in/out
- Transaction types (cash_in/cash_out)
- Transaction history with timestamps
- Remarks/notes
- Balance tracking

#### `cash_transfers`
- Teller-to-teller fund transfers
- From/To teller tracking
- Amount and remarks
- Timestamp tracking

#### `settings`
- System-wide configurations
- Key-value storage
- Default commission rates
- Min/max bet amounts

#### `audit_logs`
- Action tracking for all user activities
- Change history with before/after snapshots
- IP address logging
- User identification

See [database/ERD.md](database/ERD.md) for complete schema and relationships.

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
- [APK Build Guide (Detailed)](APK-BUILD-GUIDE.md)
- [Quick APK Build Instructions](QUICK-APK-BUILD.md)
- [APK Build Now - Current Status](APK-BUILD-NOW.md)
- [New Features List](NEW-FEATURES.md)
- [Fixes Completed](FIXES-COMPLETED.md)
- [Quick Start Guide](QUICKSTART.md)
- [How to Share App](HOW-TO-SHARE.md)
- [Database ERD](database/ERD.md)

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Teller history page shows 500 error**
- **Cause**: Missing relationship in Bet model
- **Fix**: Ensure `user` relationship removed from queries (bets don't have direct user association)

**Issue: Assets not updating on production**
- **Cause**: Cache not cleared after deployment
- **Fix**: Run `php artisan optimize:clear` on server

**Issue: QR scanner not working**
- **Cause**: Camera permissions not granted
- **Fix**: Enable camera permissions in browser/app settings

**Issue: Printer not connecting**
- **Cause**: Bluetooth not enabled or printer not paired
- **Fix**: 
  1. Enable Bluetooth on device
  2. Pair PT-210 in system Bluetooth settings first
  3. Then connect via app

**Issue: 500 input resets to 0**
- **Status**: Fixed in latest version
- **Fix**: Updated handleNumberClick logic to properly handle initial state

**Issue: Big screen not showing new fields**
- **Status**: Migration exists, needs frontend implementation
- **Fix**: Update BigScreenController and frontend to fetch/display new fields

### Getting Help

1. Check existing documentation files
2. Review [FIXES-COMPLETED.md](FIXES-COMPLETED.md) for known issue resolutions
3. Contact: support@esabong.com

---

**Made with ❤️ for the e-sabong community**
