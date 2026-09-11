namespace MoiBackend.Core.Entities;

public class PendingReturn
{
    public long Id { get; set; }
    public string ContributorName { get; set; } = null!;
    public string? Village { get; set; }
    public decimal ReceivedAmount { get; set; }
    public string? Occasion { get; set; }
    public string Status { get; set; } = "Pending"; // "Pending" | "ClosedWithEntry" | "ClosedWithoutEntry"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public string? Notes { get; set; }
    public long? MoiTransactionId { get; set; }
    public long? GivenMoiEntryId { get; set; }
    public long? EventId { get; set; }
    public Event? Event { get; set; }
}
