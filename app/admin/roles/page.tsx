'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, Trash2, Users, Mail, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { InvitationDialog } from '@/components/onboarding/invitation-dialog';
import { InvitationList } from '@/components/onboarding/invitation-list';
import { RoleGuard } from '@/components/role-guard';
import { Permission } from '@/lib/permissions';
import { useAuth } from '@/lib/hooks/useAuth';
import { isUnassigned } from '@/lib/rbac';
import { apiFetch } from '@/lib/api-config';

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  department_id: string;
  hierarchy_level: number;
  is_system_role: boolean;
  user_count: number;
  users: { id: string; name: string; email: string; image: string | null }[];
  department?: { id: string; name: string } | null;
}

export default function RoleManagementPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0);
  
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createDeptId, setCreateDeptId] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline rename
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  const startEditing = (role: Role) => {
    if (role.is_system_role) return;
    setEditingRoleId(role.id);
    setEditingName(role.name);
  };

  const cancelEditing = () => {
    setEditingRoleId(null);
    setEditingName('');
  };

  const saveRename = async (roleId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error('Role name cannot be empty');
      return;
    }
    setSavingRename(true);
    try {
      const res = await apiFetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename role');
      setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, name: trimmed } : r)));
      toast.success('Role renamed');
      cancelEditing();
    } catch (e: any) {
      toast.error(e.message || 'Failed to rename role');
    } finally {
      setSavingRename(false);
    }
  };

  useEffect(() => {
    if (!authLoading && userProfile && isUnassigned(userProfile)) {
      router.push('/welcome');
    }
  }, [authLoading, userProfile, router]);

const loadUsers = useCallback(async () => {
  try {
    setLoadingUsers(true);
    const res = await apiFetch('/api/users', { cache: 'no-store', credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || data || []);
    }
  } catch {
    toast.error('Failed to load users');
  } finally {
    setLoadingUsers(false);
  }
}, []);

const loadData = useCallback(async () => {
  try {
    setLoading(true);
    const [rolesRes, deptsRes] = await Promise.all([
      apiFetch('/api/roles', { cache: 'no-store', credentials: 'include' }),
      apiFetch('/api/departments', { cache: 'no-store', credentials: 'include' }),
    ]);

    if (!rolesRes.ok) {
      const data = await rolesRes.json();
      if (rolesRes.status === 403) {
        router.push('/welcome');
        return;
      }
      throw new Error(data.error || 'Failed to load roles');
    }

    const rolesData = await rolesRes.json();
    const deptsData = deptsRes.ok ? await deptsRes.json() : [];

    setRoles(rolesData.roles || []);
    setDepartments(Array.isArray(deptsData) ? deptsData : deptsData.departments || []);
  } catch {
    toast.error('Failed to load data');
    setRoles([]);
    setDepartments([]);
  } finally {
    setLoading(false);
  }
}, [router]);

 useEffect(() => {
    if (!authLoading && userProfile && !isUnassigned(userProfile)) {
      loadData();
      loadUsers();
    }
  }, [authLoading, userProfile, loadData, loadUsers]);

  const handleCreate = async () => {
    if (!createName.trim() || !createDeptId) {
      toast.error('Name and department are required');
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc || null,
          department_id: createDeptId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create role');
      toast.success('Role created');
      setCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      setCreateDeptId('');
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create role');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/roles/${roleToDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete role');
      }
      toast.success('Role deleted');
      setDeleteOpen(false);
      setRoleToDelete(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  if (isUnassigned(userProfile)) return null;

  return (
    <RoleGuard requirePermission={Permission.MANAGE_USER_ROLES}>
      <div className="container mx-auto space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage roles and team invitations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </div>
<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users" className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      Users
    </TabsTrigger>
    <TabsTrigger value="roles" className="flex items-center gap-2">
      <Users className="h-4 w-4" />
      Roles
    </TabsTrigger>
    <TabsTrigger value="invitations" className="flex items-center gap-2">
      <Mail className="h-4 w-4" />
      Invitations
    </TabsTrigger>
  </TabsList>
{/* Users Tab */}
<TabsContent value="users" className="mt-6">
  <Card>
    <CardHeader>
      <CardTitle>Users</CardTitle>
      <CardDescription>All users in the organization</CardDescription>
    </CardHeader>
    <CardContent>
      <Input
        placeholder="Search users..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
        className="mb-4"
      />
      {loadingUsers ? (
        <div className="text-muted-foreground py-8 text-center">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users
            .filter(
              (u) =>
                u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(userSearch.toLowerCase())
            )
            .map((u) => (
              <div
                key={u.id}
                className="hover:bg-muted/30 flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-muted-foreground text-sm">{u.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    const res = await apiFetch(`/api/users/${u.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setUsers((prev) => prev.filter((x) => x.id !== u.id));
                      toast.success('User removed');
                    } else {
                      toast.error('Failed to remove user');
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
{/* Roles Tab */}
          <TabsContent value="roles" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Roles</CardTitle>
                <CardDescription>All roles in the organization</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground py-8 text-center">Loading...</div>
                ) : roles.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    No roles found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
  <div
    key={role.id}
    className="hover:bg-muted/30 flex items-center justify-between rounded-lg border p-4 transition-colors"
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        {editingRoleId === role.id ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRename(role.id);
                if (e.key === 'Escape') cancelEditing();
              }}
              disabled={savingRename}
              className="h-8 w-48"
            />
            <Button size="sm" onClick={() => saveRename(role.id)} disabled={savingRename}>
              {savingRename ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={savingRename}>
              Cancel
            </Button>
          </div>
        ) : (
          <span
            className={`font-medium ${!role.is_system_role ? 'cursor-pointer hover:underline' : ''}`}
            onClick={() => startEditing(role)}
            title={!role.is_system_role ? 'Click to rename' : undefined}
          >
            {role.name}
          </span>
        )}
        {role.department?.name && (
          <Badge variant="outline" className="text-xs">
            {role.department.name}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          Level {role.hierarchy_level}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {role.user_count ?? 0} members
      </p>
    </div>
    {!role.is_system_role && editingRoleId !== role.id && (
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
        onClick={() => {
          setRoleToDelete(role);
          setDeleteOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Invitations</CardTitle>
                    <CardDescription>
                      Invite new team members and manage pending invitations.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <InvitationList key={invitationRefreshKey} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Role Dialog */}

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{roleToDelete?.name}&quot;? This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Invite Dialog */}
        <InvitationDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInvited={() => setInvitationRefreshKey((k) => k + 1)}
        />
      </div>
    </RoleGuard>
  );
}
