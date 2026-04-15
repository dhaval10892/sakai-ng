using RestaurantSaaS.Domain.Common;

namespace RestaurantSaas.Domain.Entities;

public class RestaurantTable : AuditableEntity
{
    public int Id{get;set;}
    public string Number{get;set;}=string.Empty;
    public int Seats{get;set;}
    public string Status{get;set;}="Available";
}
