using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using RestaurantSaaS.Infrastructure.Persistence;



namespace RestaurantSaas.Infrastructure.Persistence
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {

        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

            var basePath = Directory.GetCurrentDirectory();


            var configuration = new ConfigurationBuilder()
                .SetBasePath(basePath)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile(Path.Combine(basePath, "..", "RestaurantSaas.Api", "appsettings.json"), optional: false)
                .Build();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            optionsBuilder.UseSqlServer(connectionString);

            var currentUserService = new DesignTimeCurrentUserService();
            var httpContextAccessor = new HttpContextAccessor
            {
                HttpContext = new DefaultHttpContext()
            };
            var tenantService = new CurrentTenantService(httpContextAccessor);
            return new ApplicationDbContext(optionsBuilder.Options, currentUserService, tenantService);
        }
    }
}