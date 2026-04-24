
using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Domain.Common;

namespace RestaurantSaaS.Domain.Entities;

public class MenuItem : AuditableEntity,IHasRestaurant
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int MenuCategoryId { get; set; }
    public MenuCategory? MenuCategory { get; set; }

    public decimal Price { get; set; }
    public bool Available { get; set; }

    public string? ImageUrl { get; set; }
    public int RestaurantId { get; set; }
public Restaurant? Restaurant { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}