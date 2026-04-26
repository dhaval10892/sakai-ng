using RestaurantSaaS.Domain.Common;

namespace RestaurantSaas.Domain.Entities;

public class Payment :AuditableEntity
{
    
    public int Id{get;set;}
    public int OrderId{get; set;}
    public Order? Order{get;set;}
    public decimal Amount{set;get;}
    public decimal TipAmount { get; set; }
    public decimal CashAmount { get; set; }
    public decimal CardAmount { get; set; }
    public decimal QrAmount { get; set; }
    public string PaymentMethod{get;set;}= "Cash";
    public string PaymentStatus{get;set;}="Pending";
    public DateTime? PaidAt{get;set;}
//public int RestaurantId { get; set; }
//public Restaurant? Restaurant { get; set; }
}
