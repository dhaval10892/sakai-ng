namespace RestaurantSaaS.Application.Interfaces;

public interface IActivityLogService
{
    Task LogAsync(string action, string entityName, string entityId, string? details = null);
}