namespace MoiBackend.Core.Entities;

public class ConflictRecord
{
    public long Id { get; set; }
    public string RecipientName { get; set; } = null!;
    public string? Village { get; set; }

    /// <summary>Amount we are giving them (Given Moi)</summary>
    public decimal OurGivenAmount { get; set; }

    /// <summary>Total amount they previously gave us (Received Moi)</summary>
    public decimal TheirTotalGiftAmount { get; set; }

    /// <summary>Matched | Short | Excess | NoPreviousRecord</summary>
    public string ConflictStatus { get; set; } = "NoPreviousRecord";

    /// <summary>Human-readable description of the conflict</summary>
    public string? ConflictNote { get; set; }

    public long? GivenMoiEntryId { get; set; }
    public long? EventId { get; set; }

    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

    public Event? Event { get; set; }
}
