namespace MoiBackend.Core.Entities;

public class Contributor
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Village { get; set; }

    public ICollection<MoiTransaction> MoiTransactions { get; set; } = new List<MoiTransaction>();
    public ICollection<GoldEntry> GoldEntries { get; set; } = new List<GoldEntry>();
}
