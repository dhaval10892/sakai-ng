using System.Globalization;

namespace RestaurantSaas.Domain.Entities;

public class Order:IHasRestaurant 
{
  public int Id{get;set;}
  public string  Table{get;set;}=string.Empty;
  
  public decimal Total {get;set;}
  public string Status{get;set;}="Preparing";
public DateTime CreatedAt{get;set;}=DateTime.UtcNow;
public Payment? Payment { get; set; }
public int RestaurantId { get; set; }
public Restaurant? Restaurant { get; set; }
public ICollection<OrderItem> OrderItems{get;set;}=new List<OrderItem>();

}