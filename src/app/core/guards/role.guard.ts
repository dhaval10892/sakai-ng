import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['roles'] as string[];
  const userRoles = authService.getRoles();

  console.log('User roles:', userRoles);
  console.log('Expected roles:', expectedRoles);

  const hasAccess = expectedRoles.some(role =>
    userRoles.includes(role)
  );

  if (hasAccess) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};