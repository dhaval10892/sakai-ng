using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Application.Interfaces;

public interface IActivityLogQueryService
{
    Task<PagedResultDto<ActivityLogDto>> GetPagedAsync(ActivityLogQueryDto query);
}