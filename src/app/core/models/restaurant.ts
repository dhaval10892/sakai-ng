export interface Restaurant{
    id:number;
    name:string;
    logoUrl:string;
    isActive:boolean;
    country: string;
    state: string;
    currencyCode: string;
    currencySymbol: string;
    taxName: string;
    taxRate: number;
    createdAt?: string;
}
