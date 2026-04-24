

using RestaurantSaaS.Domain.Entities;

public class CreateRestaurantDto
{
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public bool IsActive{get;set;}
    public string AdminUsername { get; set; }=string.Empty;
    public string AdminName { get; set; }=string.Empty;
    public string Password { get; set; }=string.Empty;
    
}