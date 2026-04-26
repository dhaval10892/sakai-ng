import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '@/app/core/services/notification.service';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, CardModule],
    templateUrl: './login-page.html',
    styleUrl: './login-page.scss'
})
export class LoginPage {
    username = '';
    password = '';
    errorMessage = '';
    loading = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    login(): void {
        this.errorMessage = '';

        if (!this.username.trim() || !this.password.trim()) {
            this.errorMessage = 'Username and password are required.';
            return;
        }

        this.loading = true;
        console.log(this.username, '  ', this.password);
        this.authService
            .login({
                username: this.username,
                password: this.password
            })
            .subscribe({
                next: (response) => {
                    const role = response.role;
                    console.log(role, '');
                    if (role === 'SuperAdmin') {
                        this.router.navigate(['/super-admin']);
                    } else if (role === 'Admin') {
                        this.router.navigate(['/dashboard']);
                    } else if (role === 'Kitchen') {
                        this.router.navigate(['/kitchen']);
                    } else if (role === 'Waiter') {
                        this.router.navigate(['/waiter']);
                    } else if (role === 'Billing') {
                        this.router.navigate(['/billing']);
                    } else {
                        this.router.navigate(['/']);
                    }
                },
                error: (error) => {
                    console.error('Login failed', error);
                    this.errorMessage = error?.error || 'Invalid username or password.';
                    this.notificationService.error('Login failed', this.errorMessage);
                    this.loading = false;
                },
                complete: () => {
                    this.loading = false;
                }
            });
    }
}
