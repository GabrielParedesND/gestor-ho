import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import type { User } from '@prisma/client';

export function Users() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER' as any,
    active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await apiClient.getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.warn('Error loading users, using fallback');
      setUsers([]);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '',
      role: userToEdit.role,
      active: userToEdit.active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        const updatedUser = await apiClient.updateUser(editingUser.id, formData);
        setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
        toast.success('Usuario actualizado correctamente');
      } else {
        const newUser = await apiClient.createUser(formData);
        setUsers([...users, newUser]);
        toast.success('Usuario creado correctamente');
      }
      
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'MEMBER', active: true });
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar el usuario (modo de respaldo activo)');
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      try {
        const updatedUser = await apiClient.deactivateUser(userId);
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        toast.success('Usuario desactivado correctamente');
      } catch (error) {
        console.error('Error deactivating user:', error);
        toast.error('Error al desactivar el usuario');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'MANAGER': return 'warning';
      case 'LEADER_DEV':
      case 'LEADER_PO':
      case 'LEADER_INFRA': return 'info';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'MANAGER': return 'Manager';
      case 'LEADER_DEV': return 'Líder Dev';
      case 'LEADER_PO': return 'Líder PO';
      case 'LEADER_INFRA': return 'Líder Infra';
      case 'MEMBER': return 'Miembro';
      default: return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los administradores pueden gestionar usuarios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((userItem) => (
              <div key={userItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {userItem.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{userItem.name}</p>
                      {!userItem.active && (
                        <Badge variant="error" size="sm">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{userItem.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getRoleColor(userItem.role)} size="sm">
                        {getRoleLabel(userItem.role)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Creado: {safeFormat(userItem.createdAt || userItem.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(userItem)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(userItem.id)}
                    className="text-red-600 hover:text-red-700"
                    title={userItem.active ? "Desactivar usuario" : "Usuario ya desactivado"}
                    disabled={!userItem.active}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', role: 'MEMBER', active: true });
        }}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
            placeholder={editingUser ? "Dejar vacío para mantener actual" : ""}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="MEMBER">Miembro</option>
              <option value="LEADER_DEV">Líder Dev</option>
              <option value="LEADER_PO">Líder PO</option>
              <option value="LEADER_INFRA">Líder Infra</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Usuario activo
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', role: 'MEMBER', active: true });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}