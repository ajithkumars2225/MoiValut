namespace MoiBackend.Core.Entities;

public class GivenMoiEntry
{
    public long Id { get; set; }
    public string RecipientName { get; set; } = null!;
    public string? Village { get; set; }
    public decimal Amount { get; set; }
    public string? GiftType { get; set; } = "Cash"; // "Cash" | "Gold"
    public string? GoldDetails { get; set; }
    public string? Occasion { get; set; } // Function name e.g. Marriage, Ear Piercing
    public string? GiftTerm { get; set; } // 1st Time, 2nd Time, 3rd Time, etc.
    public DateTime GivenDate { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public long? EventId { get; set; }
    public Event? Event { get; set; }
}
