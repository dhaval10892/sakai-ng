import { Injectable } from "@angular/core";
import { CartItem } from "../models/cart-item.model";
import { MenuItem } from "../models/menu-items.model"; 

@Injectable({
    providedIn:'root'
})
export class CartService {
private cartItem:CartItem[]=[];
private tableNumber='';

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
this.cartItem.filter((x)=>x.menuItem.id!==itemCartId)
}
clearCart():void{
    this.cartItem=[];
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
}