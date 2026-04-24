import { RestaurantService } from '@/app/core/services/restaurant.service';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-dashboard',
    imports: [],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss'
})
export class Dashboard {

    stats: any = {};
constructor(private service:RestaurantService, private rdf:ChangeDetectorRef){}

ngOnInit() {
 this.load();
}
load(){
     this.service.getStats().subscribe(res => {
    this.stats = res;
    this.rdf.detectChanges();
    console.log(this.stats,"state")
  });
}
}
