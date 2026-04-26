

using RestaurantSaaS.Domain.Entities;

public class CreateRestaurantDto
{
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive{get;set;}
    public string Country { get; set; } = "India";
    public string State { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "INR";
    public string CurrencySymbol { get; set; } = "\u20B9";
    public string TaxName { get; set; } = "GST";
    public decimal TaxRate { get; set; } = 0.18m;
    public string AdminUsername { get; set; }=string.Empty;
    public string AdminName { get; set; }=string.Empty;
    public string Password { get; set; }=string.Empty;
    
}
