import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fight } from '@/types';
import { Clock } from 'lucide-react';
import * as routes from '@/routes';

interface DeclaratorDashboardProps {
    fights?: Fight[];
}

export default function DeclaratorDashboard({ fights = [] }: DeclaratorDashboardProps) {
    const pendingFights = fights.filter(f => f.status === 'betting_closed');

    return (
        <AppLayout>
            <Head title="Declarator Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Declarator Dashboard</h1>
                    <p className="text-muted-foreground">
                        Declare fight results and manage outcomes
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingFights.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Fights awaiting result declaration
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Declared Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {fights.filter(f => f.declared_by).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Results declared today
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Fights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fights.length}</div>
                            <p className="text-xs text-muted-foreground">
                                All fight events
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Pending Declarations</CardTitle>
                        <CardDescription>
                            Fights with closed betting awaiting result declaration
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingFights.length > 0 ? (
                            <div className="space-y-4">
                                {pendingFights.map((fight) => (
                                    <div
                                        key={fight.id}
                                        className="flex items-center justify-between border-b pb-4 last:border-0"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">Fight #{fight.fight_number}</span>
                                                <Badge variant="destructive">
                                                    <Clock className="mr-1 h-3 w-3" />
                                                    Awaiting Result
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <span className="text-red-600 font-medium">MERON: {fight.meron_fighter}</span>
                                                {' vs '}
                                                <span className="text-blue-600 font-medium">WALA: {fight.wala_fighter}</span>
                                            </div>
                                            {fight.betting_closed_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    Betting closed: {new Date(fight.betting_closed_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                        <Link href="/declarator/fights">
                                            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                                                Declare Result
                                            </button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No pending fight results. All fights have been declared or no betting has closed yet.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="flex items-start gap-2">
                            <span className="font-semibold">1.</span>
                            Wait for admin to close betting on a fight
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="font-semibold">2.</span>
                            Review the fight details and verify the result
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="font-semibold">3.</span>
                            Declare the result (Meron Win / Wala Win / Draw / Cancelled)
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="font-semibold">4.</span>
                            System automatically calculates and processes payouts
                        </p>
                        <p className="flex items-start gap-2 text-amber-600">
                            <span className="font-semibold">⚠️</span>
                            Result declaration is final and cannot be undone
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
