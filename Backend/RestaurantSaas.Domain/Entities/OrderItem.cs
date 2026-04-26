using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaas.Domain.Entities;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { set; get; }
    public Order? Order{set;get;}
    public int MenuItemId { set; get; }
    public MenuItem? MenuItem { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string SpecialInstructions { get; set; } = string.Empty;
}
