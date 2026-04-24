namespace RestaurantSaaS.Application.DTOs;

public class MenuItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int MenuCategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public decimal Price { get; set; }
    public bool Available { get; set; }

    public string? ImageUrl { get; set; }
     public int RestaurantId { get; set; }
}