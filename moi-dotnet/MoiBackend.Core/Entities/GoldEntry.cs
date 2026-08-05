namespace MoiBackend.Core.Entities;

public class GoldEntry
{
    public long Id { get; set; }
    public string GoldDetails { get; set; } = string.Empty;
    public DateTime EntryDate { get; set; }

    public long EventId { get; set; }
    public Event Event { get; set; } = null!;

    public long ContributorId { get; set; }
    public Contributor Contributor { get; set; } = null!;
}
