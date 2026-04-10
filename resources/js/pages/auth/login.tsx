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
                    <h1 className="text-4xl font-bold text-white mb-2">Sabing2m</h1>
                    {/* <p className="text-gray-400">Betting Management System</p> */}
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
                                        {/* <div className="flex items-center justify-between">
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
                                        </div> */}
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Password"
                                                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    const isPassword = input.type === 'password';
                                                    input.type = isPassword ? 'text' : 'password';
                                                    e.currentTarget.innerHTML = isPassword 
                                                        ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>'
                                                        : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                                tabIndex={-1}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-gray-600"
                                        />
                                        <Label htmlFor="remember" className="text-gray-300">Remember me</Label>
                                    </div> */}

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

                                {/* {canRegister && (
                                    <div className="text-center text-sm text-gray-400">
                                        Don't have an account?{' '}
                                        <TextLink href={register()} tabIndex={5} className="text-blue-400 hover:text-blue-300">
                                            Sign up
                                        </TextLink>
                                    </div>
                                )} */}
                            </>
                        )}
                    </Form>
                </div>

                {/* Test Accounts Info */}
                {/* <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Test Accounts:</p>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>• Admin: admin@esabong.com</p>
                        <p>• Declarator: declarator@esabong.com</p>
                        <p>• Teller: teller@esabong.com</p>
                        <p className="mt-2">Password: <span className="text-gray-400">password</span></p>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
