import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fight, PaginatedData } from '@/types';
import { Plus, Play, Square, Eye } from 'lucide-react';

interface AdminDashboardProps {
    fights?: PaginatedData<Fight>;
}

export default function AdminDashboard({ fights }: AdminDashboardProps) {
    const getStatusBadge = (status: Fight['status']) => {
        const variants = {
            scheduled: 'secondary',
            betting_open: 'default',
            betting_closed: 'destructive',
            result_declared: 'outline',
        } as const;

        return <Badge variant={variants[status]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
    };

    const handleOpenBetting = (fightId: number) => {
        router.post(route('admin.fights.open-betting', fightId), {}, {
            preserveScroll: true,
        });
    };

    const handleCloseBetting = (fightId: number) => {
        router.post(route('admin.fights.close-betting', fightId), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage fights, users, and system operations
                        </p>
                    </div>
                    <Link href={route('admin.fights.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Fight
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Fights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fights?.total ?? 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Betting Open</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fights?.data.filter(f => f.status === 'betting_open').length ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Betting Closed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fights?.data.filter(f => f.status === 'betting_closed').length ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fights?.data.filter(f => f.status === 'result_declared').length ?? 0}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Fights</CardTitle>
                        <CardDescription>
                            Latest fight events and their current status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {fights && fights.data.length > 0 ? (
                            <div className="space-y-4">
                                {fights.data.slice(0, 10).map((fight) => (
                                    <div
                                        key={fight.id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Fight #{fight.fight_number}</span>
                                                {getStatusBadge(fight.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="text-red-600 font-medium">MERON: {fight.meron_fighter}</span>
                                                {' vs '}
                                                <span className="text-blue-600 font-medium">WALA: {fight.wala_fighter}</span>
                                            </div>
                                            {(fight.meron_odds || fight.wala_odds) && (
                                                <div className="text-xs text-muted-foreground">
                                                    Odds: {fight.meron_odds || 'N/A'} / {fight.wala_odds || 'N/A'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={route('admin.fights.show', fight.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {fight.status === 'scheduled' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleOpenBetting(fight.id)}
                                                >
                                                    <Play className="h-4 w-4 mr-1" />
                                                    Open
                                                </Button>
                                            )}
                                            {fight.status === 'betting_open' && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCloseBetting(fight.id)}
                                                >
                                                    <Square className="h-4 w-4 mr-1" />
                                                    Close
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No fights found. Create your first fight to get started.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link href={route('admin.fights.create')}>
                                <Button className="w-full" variant="outline">
                                    Create New Fight
                                </Button>
                            </Link>
                            <Link href={route('admin.fights.index')}>
                                <Button className="w-full" variant="outline">
                                    View All Fights
                                </Button>
                            </Link>
                            <Link href={route('admin.users.index')}>
                                <Button className="w-full" variant="outline">
                                    Manage Users
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
