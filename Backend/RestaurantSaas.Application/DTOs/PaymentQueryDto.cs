namespace RestaurantSaaS.Application.DTOs;

public class PaymentQueryDto
{
    public string PaymentMethod { get; set; } = "All";
    public string PaymentStatus { get; set; } = "All";

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}