import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import { User } from '@/types';
import { useState } from 'react';

interface UsersIndexProps {
    users: User[];
}

export default function UsersIndex({ users }: UsersIndexProps) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'teller',
    });

    const getRoleBadgeColor = (role: string) => {
        switch(role) {
            case 'admin': return 'bg-purple-600';
            case 'declarator': return 'bg-green-600';
            case 'teller': return 'bg-blue-600';
            default: return 'bg-gray-600';
        }
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/admin/users', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreateModal(false);
                setFormData({ name: '', email: '', password: '', role: 'teller' });
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Users Management" />

            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
                        <p className="text-gray-400">Manage system users and their roles</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                    >
                        + Create New User
                    </button>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Role</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Created</th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-750">
                                    <td className="px-6 py-4 text-sm text-white">{user.id}</td>
                                    <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {user.role?.toUpperCase() || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.visit(`/admin/users/${user.id}/edit`)}
                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                                            >
                                                Edit
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this user?')) {
                                                            router.delete(`/admin/users/${user.id}`);
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>No users found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold mb-6">Create New User</h3>
                        
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value="teller">Teller</option>
                                    <option value="declarator">Declarator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                                >
                                    Create User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
