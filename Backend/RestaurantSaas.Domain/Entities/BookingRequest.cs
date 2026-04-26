using RestaurantSaaS.Domain.Common;

namespace RestaurantSaas.Domain.Entities;

public class BookingRequest : AuditableEntity, IHasRestaurant
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateOnly BookingDate { get; set; }
    public string BookingTime { get; set; } = string.Empty;
    public int Seats { get; set; }
    public string Occasion { get; set; } = string.Empty;
    public string Arrangement { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}
