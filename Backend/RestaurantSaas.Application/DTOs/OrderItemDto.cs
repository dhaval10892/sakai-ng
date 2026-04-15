namespace RestaurantSaas.Application.DTOs;

public class OrderItemDto
{
    public int Id { set; get; }
    public int MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

}