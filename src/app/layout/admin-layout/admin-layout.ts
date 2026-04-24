import { AuthService } from '@/app/core/services/auth.service';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterModule,ButtonModule],
    templateUrl: './admin-layout.html',
    styleUrl: './admin-layout.scss'
})
export class AdminLayout {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
