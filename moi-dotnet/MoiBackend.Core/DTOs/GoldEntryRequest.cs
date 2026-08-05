namespace MoiBackend.Core.DTOs;

public class GoldEntryRequest
{
    public long EventId { get; set; }
    public string ContributorName { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public string GoldDetails { get; set; } = string.Empty;
}
