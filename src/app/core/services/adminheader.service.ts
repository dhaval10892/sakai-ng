import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, shareReplay } from "rxjs";

@Injectable({
    providedIn:'root'
})
export class AdminHeaderService{

      private apiUrl = `${environment.apiBaseUrl}/AdminHeader`;
      private restaurantRequest$?: Observable<any>;
      constructor(private http: HttpClient) {}



getRestaurant(forceRefresh = false) {
  if (!this.restaurantRequest$ || forceRefresh) {
    this.restaurantRequest$ = this.http.get<any>(`${this.apiUrl}/me`).pipe(shareReplay(1));
  }

  return this.restaurantRequest$;
}

}
