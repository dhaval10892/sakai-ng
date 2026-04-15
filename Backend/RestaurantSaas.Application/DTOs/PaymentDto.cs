using RestaurantSaas.Domain.Entities;

namespace RestaurantSaas.Application.DTOs;

public class PaymentDto
{
    
    public int Id{set;get;}
    public int OrderId{set;get;}
    public string Table{get;set;}=string.Empty;
    public decimal Amount{get;set;}
    public string PaymentMethod{get;set;}=string.Empty;
    public string PaymentStatus{get;set;}=string.Empty;
    public DateTime CreatedAt{get;set;}
    public DateTime? PaidAt{get;set;}

}