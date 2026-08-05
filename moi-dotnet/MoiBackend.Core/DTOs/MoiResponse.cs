namespace MoiBackend.Core.DTOs;

public class MoiResponse
{
    public long TransactionId { get; set; }
    public long SerialNumber { get; set; }
    public string ContributorName { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }
    public long EventId { get; set; }

    public string? GiftTerm { get; set; }
    public decimal? ReturnAmount { get; set; }
}
