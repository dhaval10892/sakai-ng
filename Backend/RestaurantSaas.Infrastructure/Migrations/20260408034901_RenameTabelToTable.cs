using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantSaas.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameTabelToTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Tabel",
                table: "Order",
                newName: "Table");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Table",
                table: "Order",
                newName: "Tabel");
        }
    }
}
