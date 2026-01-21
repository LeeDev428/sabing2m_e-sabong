import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'declarator' | 'teller';
    is_active: boolean;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface Fight {
    id: number;
    fight_number: number;
    meron_fighter: string;
    wala_fighter: string;
    status: 'standby' | 'open' | 'lastcall' | 'closed' | 'result_declared' | 'cancelled';
    meron_odds: number | null;
    wala_odds: number | null;
    draw_odds: number | null;
    auto_odds: boolean;
    meron_betting_open?: boolean;
    wala_betting_open?: boolean;
    commission_percentage?: number;
    result: 'meron' | 'wala' | 'draw' | 'cancelled' | null;
    remarks: string | null;
    notes?: string | null;
    venue?: string | null;
    event_name?: string | null;
    round_number?: number | null;
    match_type?: string;
    special_conditions?: string | null;
    revolving_funds?: number;
    teller_assignments?: {
        id: number;
        teller: {
            id: number;
            name: string;
            email: string;
        };
        assigned_amount: number;
        current_balance: number;
    }[];
    scheduled_at: string | null;
    betting_opened_at: string | null;
    betting_closed_at: string | null;
    result_declared_at: string | null;
    created_by: number;
    declared_by: number | null;
    creator?: User;
    declarator?: User;
    created_at: string;
    updated_at: string;
}

export interface Bet {
    id: number;
    ticket_id: string;
    fight_id: number;
    teller_id: number;
    side: 'meron' | 'wala';
    amount: number;
    odds: number;
    potential_payout: number;
    status: 'active' | 'won' | 'lost' | 'cancelled' | 'refunded';
    actual_payout: number | null;
    paid_at: string | null;
    fight?: Fight;
    teller?: User;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    teller_id: number;
    type: 'cash_in' | 'cash_out';
    amount: number;
    remarks: string | null;
    teller?: User;
    created_at: string;
    updated_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
