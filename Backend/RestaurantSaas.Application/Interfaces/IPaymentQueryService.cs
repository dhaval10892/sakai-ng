using RestaurantSaas.Application.DTOs;
using RestaurantSaaS.Application.DTOs;

namespace RestaurantSaaS.Application.Interfaces;

public interface IPaymentQueryService
{
    Task<PagedResultDto<PaymentDto>> GetPagedAsync(PaymentQueryDto query);
}