# Sumbo E-Sabong - Critical Fixes Required

## Priority 1: Camera & Permissions Issues ❌🎥

### Problem:
- Camera permission only requested on 2nd app open (after closing)
- Camera fails to start even with "Always Allow" permission on some devices
- Bluetooth and Location permissions not requested upfront

### Root Cause:
Permissions are requested lazily (when features are first used) instead of on app startup.

### Solution:
1. Request all permissions on first app launch using Capacitor Permissions API
2. Add permission request flow in main entry point
3. Better error handling for camera failures

### Files to Modify:
- `resources/js/app.tsx` - Add permission initialization
- `resources/js/pages/teller/payout-scan.tsx` - Better camera error handling
- `resources/js/pages/teller/history.tsx` - Better camera error handling

---

## Priority 2: Logout Issues ❌🚪

### Problem:
- Unable to logout after pressing OK in confirmation dialog
- Issue on both Settings/Printer page and other pages

### Root Cause:
Potential session/cookie issues with Capacitor Android app. The `router.post('/logout')` may not be clearing session properly.

### Solution:
1. Add proper session clearing before logout
2. Force page reload after logout
3. Add better error handling

### Files to Modify:
- `resources/js/pages/teller/settings/printer.tsx`
- `resources/js/layouts/admin-layout.tsx`
- `resources/js/layouts/declarator-layout.tsx`

---

## Priority 3: Real-Time Balance Updates ❌💰

### Problem:
- Teller balance doesn't update in real-time when Declarator adds funds
- Cash logs don't reflect when placing bets
- Balances not syncing between Declarator assignment and Teller dashboard

### Root Cause:
1. Live data API only fetches `teller_balance` (global balance), not `current_balance` from TellerCashAssignment
2. No WebSocket/polling for TellerCashAssignment updates
3. Bet placements don't create transaction logs

### Solution:
1. Fix `/teller/api/teller/live-data` to return `current_balance` from active fight assignment
2. Add transaction logging when bets are placed
3. Ensure Declarator fund assignments trigger proper updates

### Files to Modify:
- `routes/web.php` - Fix live-data API endpoint
- `app/Http/Controllers/Teller/BetController.php` - Add transaction logging
- `app/Http/Controllers/Declarator/FightController.php` - Ensure proper assignment creation

---

## Priority 4: Admin/Declarator Balance & Reporting Issues ❌📊

### Problem:
- Balances and logs not reflecting correctly
- Reports showing incorrect data
- Most logs missing or inaccurate

### Root Cause:
- Data aggregation queries may be incorrect
- Relationship loading issues
- Missing transaction records

### Solution:
1. Audit all balance calculation queries
2. Fix eager loading of relationships
3. Ensure all financial operations create proper logs

### Files to Audit:
- `app/Http/Controllers/Admin/TellerBalanceController.php`
- `app/Http/Controllers/Admin/ReportController.php`
- `resources/js/pages/admin/teller-balances/index.tsx`
- `resources/js/pages/declarator/declared.tsx`

---

## Implementation Priority

### Phase 1 (Critical - Must Fix First):
1. ✅ Camera permissions on first app open
2. ✅ Logout functionality
3. ✅ Teller real-time balance updates

### Phase 2 (High Priority):
4. Cash transaction logging
5. Declarator fund assignment reflection
6. Camera failure error handling

### Phase 3 (Important):
7. Admin/Declarator balance fixes
8. Reporting accuracy
9. Log completeness

---

## Testing Checklist

### Teller Role:
- [ ] Camera permission requested on first app open
- [ ] Can scan QR for payout
- [ ] Can scan QR for void
- [ ] Balance updates when Declarator assigns funds
- [ ] Balance decreases when placing bet
- [ ] Cash logs show all transactions
- [ ] Logout works properly

### Declarator Role:
- [ ] Can assign funds to teller
- [ ] Assignment immediately reflects on teller side
- [ ] Balances show correctly
- [ ] Can declare results
- [ ] Logout works

### Admin Role:
- [ ] Teller balances accurate
- [ ] Reports show correct data
- [ ] Can manage teller balances
- [ ] All logs complete
- [ ] Logout works

---

## Next Steps

The issues are interconnected. We need to:

1. **Fix permissions first** - Without camera working, QR scanning is broken
2. **Fix logout second** - Critical usability issue
3. **Fix real-time balance third** - Core business logic
4. **Fix reporting last** - Data integrity issue

Would you like me to proceed with implementing these fixes in order of priority?
