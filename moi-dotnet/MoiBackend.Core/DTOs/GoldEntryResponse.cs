namespace MoiBackend.Core.DTOs;

public class GoldEntryResponse
{
    public long Id { get; set; }
    public long SerialNumber { get; set; }
    public string ContributorName { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public string GoldDetails { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }
    public long EventId { get; set; }
}
