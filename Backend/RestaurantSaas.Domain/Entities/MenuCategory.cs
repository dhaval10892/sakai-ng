using System.Data.Common;
using RestaurantSaaS.Domain.Common;
using RestaurantSaaS.Domain.Entities;

namespace RestaurantSaas.Domain.Entities;

public class MenuCategory: AuditableEntity
{
    public int Id{set;get;}
    public string Name{set;get;}=string.Empty;
    public  ICollection<MenuItem> MenuItems{set;get;}=new List<MenuItem>();

}