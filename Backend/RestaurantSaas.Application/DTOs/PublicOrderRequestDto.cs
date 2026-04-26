namespace RestaurantSaas.Application.DTOs;

public class PublicOrderRequestDto
{
    public int RestaurantId { get; set; }
    public string Table { get; set; } = string.Empty;
    public string OrderType { get; set; } = "DineIn";
    public decimal Total { get; set; }
    public string Status { get; set; } = "Preparing";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string ItemsText { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = "Cash";
    public List<OrderItemDto> Items { get; set; } = new();
}
