import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-order-success',
  standalone:true,
  imports: [CommonModule,RouterModule,ButtonModule,CardModule],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss',
})
export class OrderSuccess implements OnInit{
tableNumber='';
paymentMode='';
constructor(
private router:Router,
private activceRoute:ActivatedRoute
){}


ngOnInit(): void {
  this.tableNumber=this.activceRoute.snapshot.queryParamMap.get('table')||'';
  this.paymentMode=this.activceRoute.snapshot.queryParamMap.get('payment')||'';
}
backToMenu():void{
  this.router.navigate(['/qr-menu/',this.tableNumber || 'T1']);
}
goToKitchen():void{
  this.router.navigate(['/kitchen']);
}

}
