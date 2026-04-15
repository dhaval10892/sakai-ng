import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

import { AppUser } from '../../../../core/models/user.model';
import { CreateUser } from '../../../../core/models/create-user.model';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TagModule],
    templateUrl: './user-list.html',
    styleUrl: './user-list.scss'
})
export class UserList implements OnInit {
    users: AppUser[] = [];
    loading = false;

    createDialogVisible = false;
    roleDialogVisible = false;

    currentUser: AppUser | null = null;
    resetDialogVisible = false;
    resetTargetUser: AppUser | null = null;
    newResetPassword = '';
    newUser: CreateUser = {
        username: '',
        displayName: '',
        password: '',
        role: 'Kitchen'
    };

    roleOptions = [
        { label: 'Admin', value: 'Admin' },
        { label: 'Kitchen', value: 'Kitchen' },
        { label: 'Waiter', value: 'Waiter' },
        { label: 'Billing', value: 'Billing' }
    ];

    selectedRole = 'Kitchen';

    constructor(
        private userManagementService: UserManagementService,
        private rdf: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading = true;

        this.userManagementService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                this.loading = false;
                this.rdf.detectChanges();
            },
            error: (error) => {
                console.error('Failed to load users', error);
                this.loading = false;
                alert('Failed to load users.');
            }
        });
    }
    openResetDialog(user: AppUser): void {
        this.resetTargetUser = user;
        this.newResetPassword = '';
        this.resetDialogVisible = true;
    }

    resetPassword(): void {
        if (!this.resetTargetUser) return;

        if (!this.newResetPassword.trim()) {
            alert('New password is required.');
            return;
        }

        this.userManagementService
            .resetPassword(this.resetTargetUser.id, {
                newPassword: this.newResetPassword
            })
            .subscribe({
                next: () => {
                    this.resetDialogVisible = false;
                    this.resetTargetUser = null;
                    this.newResetPassword = '';
                    alert('Password reset successfully.');
                },
                error: (error) => {
                    console.error('Failed to reset password', error);
                    alert(error?.error || 'Failed to reset password.');
                }
            });
    }
    openCreateDialog(): void {
        this.newUser = {
            username: '',
            displayName: '',
            password: '',
            role: 'Kitchen'
        };
        this.createDialogVisible = true;
    }

    createUser(): void {
        if (!this.newUser.username.trim() || !this.newUser.displayName.trim() || !this.newUser.password.trim() || !this.newUser.role) {
            alert('Please fill all required fields.');
            return;
        }

        this.userManagementService.createUser(this.newUser).subscribe({
            next: () => {
                this.createDialogVisible = false;
                this.loadUsers();
            },
            error: (error) => {
                console.error('Failed to create user', error);
                alert(error?.error || 'Failed to create user.');
            }
        });
    }
    toggleStatus(user: AppUser): void {
        const actionText = user.isActive ? 'deactivate' : 'activate';
        const confirmed = window.confirm(`Are you sure you want to ${actionText} "${user.username}"?`);
        if (!confirmed) return;

        this.userManagementService.updateStatus(user.id, !user.isActive).subscribe({
            next: () => {
                this.loadUsers();
            },
            error: (error) => {
                console.error('Failed to update user status', error);
                alert(error?.error || 'Failed to update user status.');
            }
        });
    }
    openRoleDialog(user: AppUser): void {
        this.currentUser = user;
        this.selectedRole = user.role;
        this.roleDialogVisible = true;
    }

    updateRole(): void {
        if (!this.currentUser) return;

        this.userManagementService.updateRole(this.currentUser.id, this.selectedRole).subscribe({
            next: () => {
                this.roleDialogVisible = false;
                this.currentUser = null;
                this.loadUsers();
            },
            error: (error) => {
                console.error('Failed to update role', error);
                alert(error?.error || 'Failed to update role.');
            }
        });
    }

    deleteUser(user: AppUser): void {
        const confirmed = window.confirm(`Delete user "${user.username}"?`);
        if (!confirmed) return;

        this.userManagementService.deleteUser(user.id).subscribe({
            next: () => {
                this.loadUsers();
            },
            error: (error) => {
                console.error('Failed to delete user', error);
                alert(error?.error || 'Failed to delete user.');
            }
        });
    }

    getRoleSeverity(role: string) {
        switch (role) {
            case 'Admin':
                return 'danger';
            case 'Kitchen':
                return 'warn';
            case 'Waiter':
                return 'info';
            case 'Billing':
                return 'success';
            default:
                return 'secondary';
        }
    }
    getStatusSeverity(isActive: boolean) {
        return isActive ? 'success' : 'secondary';
    }
}
