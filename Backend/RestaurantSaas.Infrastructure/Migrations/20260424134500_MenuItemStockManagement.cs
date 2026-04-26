using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantSaas.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MenuItemStockManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LowStockThreshold",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 5);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "MenuItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LowStockThreshold",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "MenuItems");
        }
    }
}
