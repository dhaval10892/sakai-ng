import { RestaurantService } from '@/app/core/services/restaurant.service';
import { Component } from '@angular/core';
import { FormGroup,FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-create-restaurant',
    imports: [ReactiveFormsModule,RouterModule],
    standalone:true,
    templateUrl: './create-restaurant.html',
    styleUrl: './create-restaurant.scss'
})
export class CreateRestaurant {

formData: FormGroup;

constructor(
  private fb: FormBuilder,
  private service: RestaurantService
) {
  this.formData = this.fb.group({
    name: [''],
    logoUrl: ['']
  });
}

submit() {
  this.service.create(this.formData.value).subscribe(() => {
    alert('Restaurant created!');
  });
}



}
