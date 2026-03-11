
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UsersIcon, TrashIcon, PlusIcon } from './icons';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onUpdateUserRole: (userId: number, role: UserRole) => void;
  onCreateUser: (user: Omit<User, 'id'>) => boolean;
  onDeleteUser: (userId: number) => void;
}

const CreateUserForm: React.FC<{ onSave: (user: Omit<User, 'id'>) => boolean, onCancel: () => void }> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('user');
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !username || !password) {
        alert('All fields are required.');
        return;
      }
      const success = onSave({ name, username, password, role });
      if (success) {
        onCancel(); // Close form on successful creation
      }
    };
  
    return (
      <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New User</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="form-input" required/>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="form-input" required/>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" required/>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="form-input">
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Save User</button>
        </div>
      </form>
    );
};


const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose, users, currentUser, onUpdateUserRole, onCreateUser, onDeleteUser }) => {
  const [isCreating, setIsCreating] = useState(false);
  
  if (!isOpen) return null;

  const handleDelete = (userId: number) => {
    if(window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        onDeleteUser(userId);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-6 w-6 text-gray-700 dark:text-gray-200"/>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          </div>
          {!isCreating && (
             <button onClick={() => setIsCreating(true)} className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                <PlusIcon className="h-4 w-4 mr-1" /> Create User
            </button>
          )}
        </header>
        <main className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Assign roles to users. Admins can access settings, while Users can only perform data entry.
          </p>
          
          {isCreating && <CreateUserForm onSave={onCreateUser} onCancel={() => setIsCreating(false)} />}
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username} {user.id === currentUser.id && '(You)'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                      disabled={user.id === currentUser.id}
                      className="block w-32 pl-3 pr-8 py-1.5 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Role for ${user.name}`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser.id}
                        className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        aria-label={`Delete user ${user.name}`}
                        title="Delete User"
                    >
                        <TrashIcon className="h-5 w-5"/>
                    </button>
                </div>
              </div>
            ))}
          </div>
        </main>
        <footer className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-md text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">Close</button>
        </footer>
         <style>{`
          .form-input {
            display: block;
            width: 100%;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            color: #111827;
            background-color: #f9fafb;
            border: 1px solid #d1d5db;
            border-radius: 0.375rem;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .dark .form-input {
              color: #d1d5db;
              background-color: #374151;
              border-color: #4b5563;
          }
          .form-input:focus {
              outline: 2px solid transparent;
              outline-offset: 2px;
              border-color: #6366f1;
              box-shadow: 0 0 0 2px #6366f1;
          }
        `}</style>
      </div>
    </div>
  );
};

export default UserManagementModal;
