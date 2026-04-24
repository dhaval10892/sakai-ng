import { environment } from "@/environments/environment";
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn:'root'
})
export class AdminHeaderService{

      private apiUrl = `${environment.apiBaseUrl}/AdminHeader`;
      constructor(private http: HttpClient) {}



getRestaurant() {
  return this.http.get<any>(`${this.apiUrl}/me`);
}

}