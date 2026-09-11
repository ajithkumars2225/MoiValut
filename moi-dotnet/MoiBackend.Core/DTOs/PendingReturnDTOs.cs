namespace MoiBackend.Core.DTOs;

public class PendingReturnRequest
{
    public string ContributorName { get; set; } = null!;
    public string? Village { get; set; }
    public decimal ReceivedAmount { get; set; }
    public string? Occasion { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Notes { get; set; }
    public DateTime? ClosedAt { get; set; }
    public long? MoiTransactionId { get; set; }
    public long? GivenMoiEntryId { get; set; }
    public long? EventId { get; set; }
}

public class PendingReturnResponse
{
    public long Id { get; set; }
    public string ContributorName { get; set; } = null!;
    public string? Village { get; set; }
    public decimal ReceivedAmount { get; set; }
    public string? Occasion { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? Notes { get; set; }
    public long? MoiTransactionId { get; set; }
    public long? GivenMoiEntryId { get; set; }
    public long? EventId { get; set; }
}
