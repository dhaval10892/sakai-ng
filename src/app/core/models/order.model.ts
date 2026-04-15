import { OrderItem } from "./order-item.model";
export interface Order{
id:number;
table:string;
total:number;
status:string;
createdAt: string;
itemsText:string;
items:OrderItem[];

}