namespace MoiBackend.Core.Entities;

public class Event
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly? EventDate { get; set; }
    public string? Location { get; set; }
    public string? InvitationImage { get; set; }

    public ICollection<MoiTransaction> MoiTransactions { get; set; } = new List<MoiTransaction>();
    public ICollection<GoldEntry> GoldEntries { get; set; } = new List<GoldEntry>();
}
