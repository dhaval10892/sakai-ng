using RestaurantSaas.Domain.Entities;
using RestaurantSaaS.Domain.Entities;

public class Restaurant
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string Country { get; set; } = "India";

    public string State { get; set; } = string.Empty;

    public string CurrencyCode { get; set; } = "INR";

    public string CurrencySymbol { get; set; } = "\u20B9";

    public string TaxName { get; set; } = "GST";

    public decimal TaxRate { get; set; } = 0.18m;

    
    


    // 🔥 Add these   
    public ICollection<ApplicationUser> Users { get; set; } = new List<ApplicationUser>();

    public ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
    public ICollection<MenuCategory> Categories { get; set; } = new List<MenuCategory>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
}
