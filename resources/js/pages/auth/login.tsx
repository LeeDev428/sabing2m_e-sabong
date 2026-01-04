import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <Head title="Log in" />

            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">eSabong</h1>
                    <p className="text-gray-400">Betting Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
                    
                    {status && (
                        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 text-green-300 rounded-lg text-sm">
                            {status}
                        </div>
                    )}

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-gray-300">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="email@example.com"
                                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-sm text-blue-400 hover:text-blue-300"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Password"
                                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-gray-600"
                                        />
                                        <Label htmlFor="remember" className="text-gray-300">Remember me</Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Log in
                                    </Button>
                                </div>

                                {canRegister && (
                                    <div className="text-center text-sm text-gray-400">
                                        Don't have an account?{' '}
                                        <TextLink href={register()} tabIndex={5} className="text-blue-400 hover:text-blue-300">
                                            Sign up
                                        </TextLink>
                                    </div>
                                )}
                            </>
                        )}
                    </Form>
                </div>

                {/* Test Accounts Info */}
                <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Test Accounts:</p>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• Admin: admin@esabong.com</p>
                        <p>• Declarator: declarator@esabong.com</p>
                        <p>• Teller: teller@esabong.com</p>
                        <p className="mt-2">Password: <span className="text-gray-400">password</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
