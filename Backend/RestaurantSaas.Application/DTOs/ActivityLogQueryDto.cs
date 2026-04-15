namespace RestaurantSaaS.Application.DTOs;

public class ActivityLogQueryDto
{
    public string Action { get; set; } = "All";
    public string EntityName { get; set; } = "All";
    public string PerformedBy { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}