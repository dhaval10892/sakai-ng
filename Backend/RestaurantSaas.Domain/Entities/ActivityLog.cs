namespace RestaurantSaaS.Domain.Entities;

public class ActivityLog
{
    public int Id { get; set; }

    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;

    public string? PerformedBy { get; set; }
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    public string? Details { get; set; }
}