using RestaurantSaas.Application.DTOs;
using RestaurantSaas.Domain.Entities;



namespace RestaurantSaas.Application.interfaces;

public interface IPaymentService
{
    IEnumerable<PaymentDto> GetAll();
    PaymentDto? GetById(int id);
     Task<PaymentDto>  Create(PaymentDto dto);
    bool Update(int id,PaymentDto dto);
    bool Delete(int id);

}