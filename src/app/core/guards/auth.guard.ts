import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// export const authGuard: CanActivateFn = () => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   if (authService.isLoggedIn()) {
//     return true;
//   }

//   return router.createUrlTree(['/login']);
// };
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  console.log('AuthGuard - isLoggedIn:', isLoggedIn);

  if (isLoggedIn) {
    return true;
  }

  return router.createUrlTree(['/login']);
};