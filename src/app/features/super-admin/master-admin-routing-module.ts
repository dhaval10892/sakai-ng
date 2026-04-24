import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard'
import { Restaurants } from './restaurants/restaurants'; 
import { CreateRestaurant } from './create-restaurant/create-restaurant'; 

const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'restaurants', component: Restaurants },
  { path: 'restaurants/create', component: CreateRestaurant }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAdminRoutingModule {}