namespace MoiBackend.Core.DTOs;

public class GivenMoiResponse
{
    public long Id { get; set; }
    public string RecipientName { get; set; } = null!;
    public string? Village { get; set; }
    public decimal Amount { get; set; }
    public string? GiftType { get; set; }
    public string? GoldDetails { get; set; }
    public string? Occasion { get; set; }
    public string? GiftTerm { get; set; }
    public DateTime GivenDate { get; set; }
    public string? Notes { get; set; }
    public long? EventId { get; set; }
}
