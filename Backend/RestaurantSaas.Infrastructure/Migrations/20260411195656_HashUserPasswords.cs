using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RestaurantSaas.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HashUserPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Password",
                table: "AppUser");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "AppUser",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "AppUser");

            migrationBuilder.AddColumn<string>(
                name: "Password",
                table: "AppUser",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
