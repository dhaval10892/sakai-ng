namespace RestaurantSaas.Application.DTOs;

public class RestaurantTableDto
{
    public int Id{get;set;}
    public string Number{get;set;}=string.Empty;
    public int Seats{get;set;}
    public string Status{get;set;}=string.Empty;
}