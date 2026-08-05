namespace MoiBackend.Core.Entities;

public class MoiTransaction
{
    public long Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime TransactionDate { get; set; }

    public string? GiftTerm { get; set; }
    public decimal? ReturnAmount { get; set; }

    public long EventId { get; set; }
    public Event Event { get; set; } = null!;

    public long ContributorId { get; set; }
    public Contributor Contributor { get; set; } = null!;
}
