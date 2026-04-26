import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';

import { UserManagementService } from '../../../../core/services/user-management.service';
import { NotificationService } from '@/app/core/services/notification.service';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, CardModule, PasswordModule],
  templateUrl: './security-page.html',
  styleUrl: './security-page.scss'
})
export class SecurityPage {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private userManagementService: UserManagementService,
    private notificationService: NotificationService
  ) {}

  changePassword(): void {
    if (!this.currentPassword.trim() || !this.newPassword.trim()) {
      this.notificationService.warn('Missing fields', 'Please fill all required fields.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.warn('Password mismatch', 'New password and confirm password do not match.');
      return;
    }

    this.loading = true;

    this.userManagementService.changePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.notificationService.success('Password updated', 'Your password was changed successfully.');
      },
      error: (error) => {
        console.error('Failed to change password', error);
        this.loading = false;
        this.notificationService.showApiError(error, 'Failed to change password.');
      }
    });
  }
}
