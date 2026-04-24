namespace RestaurantSaas.Application.DTOs;

public class OrderDto
{
    public int Id{get;set;}
    public string Table{get;set;}=string.Empty;
    public decimal Total{get;set;}
    public string Status{get;set;}=string.Empty;
    public DateTime CreatedAt{get;set;}
    public string ItemsText { get; set; } = string.Empty;
    public List<OrderItemDto> Items{get;set;}=new();
     public int RestaurantId { get; set; }
}