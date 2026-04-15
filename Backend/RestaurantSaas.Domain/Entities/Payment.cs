using RestaurantSaaS.Domain.Common;

namespace RestaurantSaas.Domain.Entities;

public class Payment :AuditableEntity
{
    
    public int Id{get;set;}
    public int OrderId{get; set;}
    public Order? Order{get;set;}
    public decimal Amount{set;get;}
    public string PaymentMethod{get;set;}= "Cash";
    public string PaymentStatus{get;set;}="Pending";
        public DateTime? PaidAt{get;set;}

}
