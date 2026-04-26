import { Injectable } from "@angular/core";
import { CartItem } from "../models/cart-item.model";
import { MenuItem } from "../models/menu-items.model"; 

@Injectable({
    providedIn:'root'
})
export class CartService {
private cartItem:CartItem[]=[];
private tableNumber='';
private restaurantId: number | null = null;
private restaurantName = '';
private orderType: 'DineIn' | 'Takeaway' = 'DineIn';

getCartItems():CartItem[]{
    return [...this.cartItem]
}
addCartItem(menuItem:MenuItem,tableNumber?:string){
    if(tableNumber){
        this.tableNumber=tableNumber;
    }
    const extistingItem=this.cartItem.find((m)=>m.menuItem.id===menuItem.id)
    if(extistingItem){
        extistingItem.quantity+=1;
    }else{
        this.cartItem.push({
            menuItem,
            quantity:1
        });
    }
}
setOrderContext(context: { tableNumber?: string; restaurantId?: number | null; restaurantName?: string; orderType?: 'DineIn' | 'Takeaway' }): void {
    if (context.tableNumber !== undefined) {
        this.tableNumber = context.tableNumber;
    }

    if (context.restaurantId !== undefined) {
        this.restaurantId = context.restaurantId;
    }

    if (context.restaurantName !== undefined) {
        this.restaurantName = context.restaurantName;
    }

    if (context.orderType) {
        this.orderType = context.orderType;
    }
}
increaseQuantity(menuItemId:number):void{
const item=this.cartItem.find((x)=>x.menuItem.id===menuItemId);
    if(item){
       item.quantity+=1;
    }
}
decreaseQuantity(menuItemId:number):void{
    const item=this.cartItem.find((X)=>X.menuItem.id===menuItemId);
    if(!item){return}
    if(item.quantity>1){
        item.quantity-=1;
    }else{
        this.removeFromCart(menuItemId)
    }
}
removeFromCart(itemCartId:number):void{
this.cartItem = this.cartItem.filter((x)=>x.menuItem.id!==itemCartId)
}
updateSpecialInstructions(menuItemId:number,instructions:string):void{
    const item=this.cartItem.find((x)=>x.menuItem.id===menuItemId);
    if(item){
        item.specialInstructions=instructions.trim();
    }
}
clearCart():void{
    this.cartItem=[];
    this.tableNumber = '';
    this.restaurantId = null;
    this.restaurantName = '';
    this.orderType = 'DineIn';
}
getCartCount():number{
    return this.cartItem.reduce((sum,item)=>sum+item.quantity,0);
}
getCartTotal():number{
    return this.cartItem.reduce((total,item)=>total+item.menuItem.price*item.quantity,0)
}
setTableNumer(tableNumer:string):void{
    this.tableNumber=tableNumer;
}
getTableNumber():string{
    return this.tableNumber;
}
setRestaurantId(restaurantId: number | null): void {
    this.restaurantId = restaurantId;
}
getRestaurantId(): number | null {
    return this.restaurantId;
}
setRestaurantName(restaurantName: string): void {
    this.restaurantName = restaurantName;
}
getRestaurantName(): string {
    return this.restaurantName;
}
setOrderType(orderType: 'DineIn' | 'Takeaway'): void {
    this.orderType = orderType;
}
getOrderType(): 'DineIn' | 'Takeaway' {
    return this.orderType;
}
}
