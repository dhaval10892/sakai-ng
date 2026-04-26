namespace RestaurantSaas.Application.DTOs;

public class PublicRestaurantDiscoveryDto
{
    public int RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string Country { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string CuisineLabel { get; set; } = string.Empty;
    public string FeaturedItemName { get; set; } = string.Empty;
    public decimal FeaturedItemPrice { get; set; }
    public string? FeaturedImageUrl { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public int EstimatedMinutes { get; set; }
}
