namespace RestaurantSaas.Application.DTOs;

public class PublicRestaurantSettingsDto
{
    public int RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string State { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "INR";
    public string CurrencySymbol { get; set; } = "\u20B9";
    public string TaxName { get; set; } = "GST";
    public decimal TaxRate { get; set; }
}
